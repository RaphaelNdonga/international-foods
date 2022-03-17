//Pinata is an api that allows you to host files using IPFS
import pinataSdk from '@pinata/sdk'

function getJSONURI(name, imageURL, description, location, price) {
    //These are the api keys for using the Pinata API
    const pinata = pinataSdk('f2e0188887f4b5ae161f', '92ae688fbe61ce9abcf496ffee7efd82b56eeaf9838293b49e25134280f6cc53')

    pinata.testAuthentication().then((result) => {
        console.log(result)
    }).catch((error) => {
        console.log(error)
    })
    //Generating the JSON for the food NFT
    const body = {
        name: name,
        description: description,
        image: imageURL,
        location: location,
        price: price
    }
    const options = {
        pinataMetadata: {
            name: `${name}.json`
        }
    }
    let uri
    pinata.pinJSONToIPFS(body, options).then((result) => {
        console.log(result)
        console.log("And the link can be found at: ")
        uri = `https://ipfs.io/ipfs/${result.IpfsHash}?filename=${name}.json`
        console.log(uri)
    }).catch((error) => {
        console.log(error)
    })
    return uri
}

export { getJSONURI }
