const { InputStream } = require('skyway-m-pipe-sdk/connector');
var fetch = require('node-fetch');
const client_id = process.env.COTOHA_CLIENT_ID
const client_secret = process.env.COTOHA_CLIENT_SECRET
const inHost = process.env.IN_HOST
const inPort = process.env.IN_PORT
const token   = process.env.TOKEN

///////////////////////////////////////////////
// added for realtime push
const clientId = process.env.CLIENT_ID
const endPoint = process.env.END_POINT
///////////////////////////////////////////////

const start = () => {
  var access_token;

    token_url = "https://api.ce-cotoha.com/v1/oauth/accesstokens"
    headers = {
        "Content-Type": "application/json",
        "charset": "UTF-8"
    }

    data = {
        "grantType": "client_credentials",
        "clientId": client_id,
        "clientSecret": client_secret
    }

    fetch(token_url, {
       method: 'POST',
       headers: headers,
       body: JSON.stringify(data),
    })
    .then(res => res.json())
    .then(json => {
       access_token = json["access_token"]

       const inputStream = new InputStream();

       inputStream.start({ host: inHost, port: inPort, token });

       inputStream.on( 'data', async data => {
         const payload = data.payload.toString()

         parse_url = "https://api.ce-cotoha.com/api/dev/nlp/v1/parse"

         headers = {
             "Content-Type": "application/json",
             "charset": "UTF-8",
             "Authorization": `Bearer ${access_token}`
         }

         //var jsondata = JSON.stringify(payload);
         //console.log("payload:" + payload);
         var parsed_jsondata = JSON.parse(payload);
         //console.log("jsondata" + parsed_jsondata)
         if( parsed_jsondata.results.length > 0 ){
           parse_data = {
               "sentence": parsed_jsondata.results[0].alternatives[0].transcript,
               "type": "default"
           }

           fetch(parse_url, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(parse_data),
           })
           .then(res => res.json())
           .then(json => {
              console.log(JSON.stringify(json,null,'\t'));

              //////////////////////////////////////////////////
              // added for ws push
              if( endPoint && endPoint.indexOf("http") === 0 ) {
                const bodyObj = {
                  roomName: clientId,
                  data: {
                    type: "cotoha-parse",
                    payload: json
                  }
                }
                fetch( endPoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify( bodyObj )
                }).then( res => console.log('post finished') )
                  .catch( err => console.warn( err.message ) )
              }
              //////////////////////////////////////////////////

            });
         }
        });
     });

}

start()
