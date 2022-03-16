//Pinata is an api that allows you to host files using IPFS
import pinataSdk from '@pinata/sdk'

function createJSONFile(name, imageURL, description, location, price) {
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
        imageURL: imageURL,
        description: description,
        location: location,
        price: price
    }
    const options = {
        pinataMetadata: {
            name: `${name}.json`
        }
    }
    pinata.pinJSONToIPFS(body, options).then((result) => {
        console.log(result)
        console.log("And the link can be found at: ")
        console.log(`https://ipfs.io/ipfs/${result.IpfsHash}?filename=${name}.json`)
    }).catch((error) => {
        console.log(error)
    })
}

function main() {
    createJSONFile(
        "Rice",
        "https://media.istockphoto.com/photos/rice-in-a-bowl-on-a-white-background-picture-id860931464?k=20&m=860931464&s=612x612&w=0&h=Q5ADqpZbQbVzm3YkNwbyhn023S64em9w08O0xg0b0KE=",
        "Sweet sweet rice",
        "china",
        10
    )
}

main()

