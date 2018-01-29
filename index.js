const AnyProxy = require('anyproxy');
const exec = require('child_process').exec;
const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');

let reqOptions = {
  hostname: 'www.baidu.com',
     method: 'GET',
     headers: 
      { 
        Connection: 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.119 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate, br',
        Cookie: 'BAIDUID=430A649DF24452418447946FF5607105:FG=1; BIDUPSID=430A649DF24452418447946FF5607105; PSTM=1507474679; BDUSS=5DMjN0dGxwYS01R2ZhUndIR2l2VDZXT2pwYmNQZFllQTcweWM1NW53VWx5Z0ZhTUFBQUFBJCQAAAAAAAAAAAEAAACFfi0hTWFyc19UYQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACU92lklPdpZTm; BD_UPN=123253; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; NOJS=1; H_PS_PSSID=1462_13550_21118_20927; BD_CK_SAM=1; PSINO=6; BD_HOME=1; BDRCVFR[feWj1Vr5u3D]=mk3SLVN4HKm; BDRCVFR[M7pOaqtZgJR]=I67x6TjHwwYf0; sug=3; sugstore=0; ORIGIN=0; bdime=0; H_PS_645EC=31dcWJ0JJpfCkzmdNu%2Bfmh179RM5u4TPjxNwURQUbN1xsHNV2UKeNfDiz3A'
      },
};
// const quiz ='「不在沉默中爆发，就在沉默中灭亡」出自鲁迅的哪篇文章？'
// let options = [
//   "彷徨",
//   "纪念刘和珍君",
//   "呐喊",
//   "狂人日记"
// ];

function sendReq(reqOptions,quiz){
  const path = `/s?wd=${encodeURI(quiz)}`
  reqOptions = {...reqOptions,path}
  return new Promise(resolve=>{
    callback = (res) => {
      let bufferList=[];
      res.on('data',(d)=>{
          bufferList.push(d)
      });
      res.on('end',()=>{
        let buffer = Buffer.concat(bufferList);
        zlib.gunzip(buffer, (err, decoded)=> {
          resolve(decoded.toString());
          console.log(decoded.toString())
        })
      });
    }
    let req = https.request(reqOptions,callback);
    req.end();
  })
}
// async function aa(){
//   console.log('11111111111')
//   const content = await sendReq(reqOptions,quiz)
//   const $ = cheerio.load(content, { decodeEntities: false });
//   const resList = $('.result');

//   options.forEach((answer,i) => {
//     let time = 0;
//     resList.each((index, result)=>{
//       if($(result).text().indexOf(answer)>=0){
//         time++
//       }
//     })
//     options[i] = `${answer}[${time}]`
//   });
//   console.log( options)
//   console.log('3333333333333333333')
// }
// aa()



// if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
//   AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
//     // let users to trust this CA before using proxy
//     if (!error) {
//       const certDir = require('path').dirname(keyPath);
//       console.log('The cert is generated at', certDir);
//       const isWin = /^win/.test(process.platform);
//       if (isWin) {
//         exec('start .', { cwd: certDir });
//       } else {
//         exec('open .', { cwd: certDir });
//       }
//     } else {
//       console.error('error when generating rootCA', error);
//     }
//   });
// }
const rule ={
  // 模块介绍
  summary: 'my customized rule for AnyProxy',
  // 发送请求前拦截处理
  *beforeSendRequest(requestDetail) {
    if(requestDetail.url.indexOf('question/bat')>0){
      console.log('url==================='+requestDetail.url)
    }
  },
  // 发送响应前处理
  *beforeSendResponse(requestDetail, responseDetail) {
    if(requestDetail.url.indexOf('https://question.hortor.net/question/bat/find')==0){
      let body = JSON.parse(responseDetail.response.body.toString())
      let options = body.data.options
      console.log(body.data.curTime,'接口时间---------------------')
      //endTime:1517071443  curTime:1517071428
      let content = yield sendReq(reqOptions,body.data.quiz)
      const $ = cheerio.load(content, { decodeEntities: false });
      const resList = $('.result');
      options.forEach((answer,i) => {
        let time = 0;
        resList.each((index, result)=>{
          if($(result).text().indexOf(answer)>=0){
            time++
          }
        })
        options[i] = `${answer}[${time}]`
      });
      body.data.options = options
      // body.data.endTime = body.data.endTime + 2
      // body.data.curTime = body.data.curTime + 2
      console.log(Date.now(),'本地时间------------------')
      body=new Buffer(JSON.stringify(body))
      responseDetail.response.body = body
      return responseDetail;
    }
  },
  // 是否处理https请求
  *beforeDealHttpsRequest(requestDetail) {
    return true
   },
  // 请求出错的事件
  *onError(requestDetail, error) { /* ... */ },
  // https连接服务器出错
  *onConnectError(requestDetail, error) { /* ... */ }
};
const options = {
  port: 8001,
  rule,
  webInterface: {
    enable: true,
    webPort: 8002,
    wsPort: 8003,
  },
  throttle: 10000,
  silent: false
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => { /* */ });
proxyServer.on('error', (e) => { /* */ });
proxyServer.start();
