const WS_URL = "wss://ggoijsfbll.execute-api.us-west-2.amazonaws.com/beta"
const APIKEY = "3a712cac-8d9c-4ea7-b25c-e566473d152e"
const MPIPE_ENTRYPOINT = "https://userfront.m-pipe.net/cotoha-ws:8e3ae7b3-0147-43d2-85a4-47724c10805b/"

$("form").on("submit", async ev => {
  ev.preventDefault()
  $("form button").attr("disabled", "disabled")

  try {
    updateStatus('Start handling audio device')
    const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true})

    updateStatus('connecting to SkyWay server')
    const peer = new Peer({
      key: APIKEY, debug: 3
    })

    peer.on( 'open', async id => {
      updateStatus('start WS connection for transcript result')
      $("#local-id").text( id )
      const ws = await startWS(id)

      updateStatus('connecting to M-PIPE...')
      const { peerid, token } = await getMpipePeerid( id )

      updateStatus('start establishing WebRTC session with M-PIPE...')
      const call = peer.call( peerid, stream, { metadata: { token } })

      call.on('stream', s => {
        updateStatus('webrtc sesseion with M-PIPE started.')
      })

    })
  } catch(err) {
    console.error(err)
  }
})

const updateStatus = str => {
  $("#status").text( str )
}

const startWS = roomName => {
  return new Promise( (resolve, reject) => {
    let resolved = false
    const ws = new WebSocket( `${WS_URL}?roomName=${roomName}` )

    ws.onopen = ev => {
      resolved = true
      resolve(ws)
    }

    ws.onmessage = ev => {
      try {
        const data = JSON.parse( ev.data )
        const type = data.type
        const payload = data.payload

        if( type === "recognition-result" && payload.results.length > 0 ) {
          $("#recognition-result").html( JSON.stringify(payload, null, 2) )
        } else if( type === "cotoha-parse" || type === "cotoha-emotion" ) {
          $("#"+type).html( JSON.stringify(payload, null, 2 ) )
        }
        console.log( data )
      } catch( err ) {
        console.warn(err)
      }
    }

    ws.onclose = ev => {
      if( !resolved ) reject(new Error('ws has been closed'))
      resolved = true
    }

    ws.onerror = ev => {
      if( !resolved ) reject( ev )
      resolved = true
    }
  })
}

const getMpipePeerid = async ( localId ) => {
  const bodyObj = {
    eventParams: {
      clientId: localId
    }
  }
  const res = await fetch(`${MPIPE_ENTRYPOINT}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify( bodyObj )
  })
  const { token, peerid } = await res.json()
  console.log( token, peerid )

  return { token, peerid }
}

