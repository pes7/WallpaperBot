const { Markup,Telegraf } = require('telegraf')
const { log } = require('console');
const arGs = require('./commandArgs');
const MongoClient = require("mongodb").MongoClient;
const request = require('request');

const _DEBUG = true;

const token = process.env.TOKEN;
const bot = new Telegraf(token)

const _setting = { useUnifiedTopology: true,connectTimeoutMS: 30000,keepAlive: 1 };
const _url = 'mongodb://root:password@mongor:27017/';
//const _url = 'mongodb://root:password@192.168.1.100:27020/';
const _DB = "WabboBot";
const _WallpaperTable = 'WallpaperPosted';

var startedThread = 0;
const _time_out = 120;
const _pass = 8912;
const _group = "animeeew";

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
    console.log(client)
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

bot.command("test", (ctx)=>{
  request('https://wall.alphacoders.com/api2.0/get.php?auth=17900fc9b6f655f9d9e39a96a256fcd2&method=random&info_level=2&category=Anime', { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    if (body.success == true)
      {
        console.log(body.wallpapers);
      }
    });
})

bot.use(arGs());
function cycle(wallpepers){
  if(wallpepers.length > 0)
  {
    var o = wallpepers.pop();
    if("Anime" === o.category){
      Wallpaper.getWallpaper(o.id,(resp)=>{
        if(resp === null){
          Wallpaper.insertWallpaper(o);
          var img = o.url_image;
            bot.telegram.sendPhoto(`@${_group}`,img,{
              caption:`Resolution: ${o.height}x${o.width}\nType: ${o.file_type.toUpperCase()}\nDownload: ${img}`
            });
        }else{
          cycle(wallpepers)
        }
      })
    }else{cycle(wallpepers)}
  }
}

function start(){
  if(startedThread == 0){
    var _time_pass = 0;
    console.log('Bot started!');
    startedThread = setInterval(()=>{
      _time_pass++;
      if(_time_pass >= _time_out){
        _time_pass = 0;
        request('https://wall.alphacoders.com/api2.0/get.php?auth=17900fc9b6f655f9d9e39a96a256fcd2&method=random&info_level=2&category=Anime', { json: true }, (err, res, body) => {
          if (err) { return console.log(err); }
            if (body.success == true)
              {
                cycle(body.wallpapers);
              }
          });
      }
    },1000)
  }
}

bot.command("bot_stop", (ctx) =>{
  var pass = ctx.state.command.args[0];
  if(pass == _pass){
    if(startedThread != 0){
      clearInterval(startedThread);
      ctx.reply('Bot stoped!');
    }
  }else{ctx.reply('Auch error!');}
})

dbWork.createDBandTABLE();
bot.launch()
start()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))