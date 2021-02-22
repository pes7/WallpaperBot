const schedule = require('node-schedule');
const { Markup,Telegraf } = require('telegraf')
const { log } = require('console');
const arGs = require('./commandArgs');
const MongoClient = require("mongodb").MongoClient;
const request = require('request');
const { brotliDecompress } = require('zlib');
const { COPYFILE_FICLONE } = require('constants');

const _DEBUG = true;

const token = "1647467570:AAFOOsYoHOKICP6PoWz0iF201pCnRaDjsak";
const bot = new Telegraf(token)

const _setting = { useUnifiedTopology: true,connectTimeoutMS: 30000,keepAlive: 1 };
const _url = 'mongodb://root:password@localhost:27017/';
const _DB = "WabboBot";
const _WallpaperTable = 'WallpaperPosted';

const startedThread = 0;
const _time_out = 60;
const _pass = 8912;
var runtime = 0;

class Wallpaper {
  static insertWallpaper(wallpaper,clb = ()=>{}) {
    const mongoClient = new MongoClient(_url, _setting);
    mongoClient.connect(function(err, client){
        const db = client.db(_DB);
        const collection = db.collection(_WallpaperTable);
        collection.insertOne(wallpaper, function(err, result){
            if(err){ 
                return console.log(err,'err');
            }
            clb(wallpaper);
            client.close();
        });
    });
  }

  static getWallpaper(id, clb) {
    const mongoClient = new MongoClient(_url, _setting);
    mongoClient.connect(function(err, client){
      if(err) return console.log(err,'err');
      const db = client.db(_DB);
      db.collection(_WallpaperTable).findOne({'id':id}, function(err, result) {
        if (err) { console.log(err,'err'); return null; }
        client.close();
        clb(result);
      });
    });
  }
}

class dbWork {
  static createDBandTABLE(){
    dbWork.creatTable(_WallpaperTable);
  }

  static jsonRead(jsonName,tableName){
    /*Load JSON*/
    const ww = JSON.parse(fs.readFileSync(`json/${jsonName}.json`, 'utf8'));
    var ii = Object.keys(ww).map(key => {
      return ww[key];
    })
    const mongoClient = new MongoClient(_url, _setting);
    mongoClient.connect(function(err, client){
      const db = client.db(_DB);
      const collection = db.collection(tableName);
      collection.insertMany(ii, function(err, result){
          if(err){ 
              return console.log(err,'err');
          }
          client.close();
      });
    });
  }

  static creatTable(table, json = undefined, clb = undefined){
    console.log(`Check ${table}`)
    const client = new MongoClient(_url,_setting);
    client.connect(function(err) {
      if (err) { console.log(`Database ${_DB} not EXIST!!! Create IT NOW!!!!`); return false; };
      var db = client.db(_DB);
        db.createCollection(table, function(err, res) {
          if (err?.code != 48) {console.log(err,'err'); clb ? clb(): console.log(`${table} no clb`); }
          if (json != undefined) { dbWork.jsonRead(json,table) }
          console.log(`Collection ${table} created!`);
          client.close();
        });
    });
  }
}

bot.use(arGs());

const cat = "Anime";
bot.command("test", (ctx) => {
  request('http://wall.alphacoders.com/api2.0/get.php?method=highest_rated&page=1&info_level=2&page=2', { json: true }, (err, res, body) => {
  if (err) { return console.log(err); }
  if (body.success == true)
    {
      cycle(body.wallpapers, ctx);
    }
  });
})

function cycle(wallpepers, ctx){
  if(wallpepers.length > 0)
  {
    var o = wallpepers.pop();
    if(cat === o.category){
      Wallpaper.getWallpaper(o.id,(resp)=>{
        if(resp === null){
          Wallpaper.insertWallpaper(o);
          ctx.reply(o.url_image)
        }else{
          cycle(wallpepers, ctx)
        }
      })
    }else{cycle(wallpepers, ctx)}
  }
}

bot.command("bot_start", (ctx) => {
  if(startedThread == 0){
    var _time_pass = 0;
    ctx.reply('Bot started!');
    startedThread = setInterval(()=>{
      _time_pass++;
      runtime++;
      if(_time_pass >= _time_out){
        _time_pass = 0;

      }
    },1000)
  }
})

bot.command("bot_stop", (ctx) =>{
  var pass = ctx.state.command.args[0];
  if(pass == _pass){
    if(startedThread != 0){
      clearInterval(startedThread);
      ctx.reply('Bot stoped!');
    }
  }else{ctx.reply('Auch error!');}
})

bot.start((ctx) => {
  
})

bot.help((ctx) => ctx.reply(`${_helpCommands}`))

dbWork.createDBandTABLE();
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))