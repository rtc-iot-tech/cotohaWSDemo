const { InputStream } = require('skyway-m-pipe-sdk/connector');
const fetch = require('node-fetch')

// 環境変数から接続用の情報を取得する
const inHost  = process.env.IN_HOST
const inPort  = process.env.IN_PORT
const token   = process.env.TOKEN
const clientId = process.env.CLIENT_ID
const endPoint = process.env.END_POINT
const label   = process.env.LABEL

console.log(inHost, inPort, token, clientId, endPoint)

const start = () => {
  try {
    const inputStream = new InputStream();
    // 前段のファンクションに接続する
    inputStream.start({ host: inHost, port: inPort, token });

    // データを受信すると `data` イベントが発生する
    inputStream.on( 'data', data => {
      const payload = JSON.parse(data.payload.toString())
      console.log( label, JSON.stringify( payload ) )

      if( endPoint && endPoint.indexOf("http") === 0 ) {
        const bodyObj = {
          roomName: clientId,
          data: {
            type: label,
            payload
          }
        }
        fetch( endPoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify( bodyObj )
        }).then( res => console.log('post finished') )
        .catch( err => console.warn( err.message ) )
      }
    })
  } catch(err) {
    console.warn(err);
    process.exit(-1);
  }
}

start()
