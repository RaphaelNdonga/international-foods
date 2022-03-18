import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import MarketPlaceAbi from '../contract/marketplace.abi.json'
import ERC20Abi from '../contract/erc20.abi.json'
import NFFTAbi from '../contract/nfft.abi.json'
// import { getJSONURI } from './pinata'
import pinataSdk from '@pinata/sdk'

const ERC20_decimals = 18

let kit
let contract
let nfftContract
let products = []
let clickedProductIndex = 0

window.addEventListener('load', async () => {
    notification("⌛ Loading...")
    await connectCeloWallet()
    await getBalance()
    await getProducts()
    notificationOff()
});

const MPContractAdress = "0x7a6eC3b07576000C740851aA71b3a5AfF82c67A4"
const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const NFFTAddress = "0xF23085ea26d8F1d154cd81670CC7699331C9b49C"

const connectCeloWallet = async function () {
    if (window.celo) {
        notification("Please approve this dApp to use it")
        try {
            await window.celo.enable()
            notificationOff()
            const web3 = new Web3(window.celo)
            kit = newKitFromWeb3(web3)

            const accounts = await kit.web3.eth.getAccounts()
            kit.defaultAccount = accounts[0]
            contract = new kit.web3.eth.Contract(MarketPlaceAbi, MPContractAdress)
            nfftContract = new kit.web3.eth.Contract(NFFTAbi, NFFTAddress)
        } catch (error) {
            notification(`Error: ${error}`)
        }
    } else {
        notification("Error. Please install celo extension wallet")
    }
}

async function approve(_price) {
    const cUSDContract = new kit.web3.eth.Contract(ERC20Abi, cUSDAddress)
    const result = await cUSDContract.methods.approve(MPContractAdress, _price).send({ from: kit.defaultAccount })
    return result
}


const getBalance = async function () {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_decimals).toFixed(2)
    document.querySelector("#balance").textContent = cUSDBalance

}

// const getProducts = async function () {
//     const productsLength = await contract.methods.getProductsLength().call()
//     const _products = []

//     for (let i = 0; i < productsLength; i++) {
//         let _product = new Promise(async (resolve, reject) => {
//             let p = await contract.methods.readProduct(i).call()
//             resolve({
//                 index: i,
//                 owner: p[0],
//                 name: p[1],
//                 image: p[2],
//                 description: p[3],
//                 location: p[4],
//                 price: new BigNumber(p[5]),
//                 sold: p[6],
//             })
//         })
//         _products.push(_product)
//     }
//     products = await Promise.all(_products)
//     renderProducts()
// }

const getProducts = async function () {
    const productsLength = await nfftContract.methods.tokenId().call()
    const uris = []
    const owners = []
    for (let i = 0; i < productsLength; i++) {
        let uri = new Promise(async (resolve, reject) => {
            let stringUri = await nfftContract.methods.tokenURI(i).call()
            resolve(stringUri)
        })
        let owner = new Promise(async (resolve, reject) => {
            let _owner = await nfftContract.methods.ownerOf(i).call()
            resolve(_owner)
        })
        uris.push(uri)
        owners.push(owner)
    }
    let resultUris = await Promise.all(uris)
    let resultOwners = await Promise.all(owners)
    console.log(uris)
    let _products = []
    for (let j = 0; j < productsLength; j++) {
        let item = resultUris[j]
        console.log("tokenURI is ", item)
        const request = new Request(item)
        fetch(request).then(response => response.json()).catch((error) => {
            console.log("There was an error parsing the json: ", error)
        }).then(data => {
            console.log(data)
            let _product = {
                index: j,
                owner: resultOwners[j],
                name: data.name,
                image: data.image,
                description: data.description,
                location: data.location,
                price: new BigNumber(data.price),
                sold: 0,
            }

            _products.push(_product)
        }).catch((error) => {
            console.log("There was an error with the json file: ", error)
            let _product = {
                index: error,
                owner: resultOwners[j],
                name: error,
                image: error,
                description: error,
                location: error,
                price: new BigNumber(0),
                sold: 0,
            }
            _products.push(_product)
        }).finally(() => {
            products = _products
            console.log(products)
            renderProducts()
        })
    }
}

function renderProducts() {
    document.getElementById("marketplace").innerHTML = ""
    products.forEach((_product) => {
        const newDiv = document.createElement("div")
        newDiv.className = "col-md-4"
        newDiv.innerHTML = productTemplate(_product)
        document.getElementById("marketplace").appendChild(newDiv)
    })
}

function productTemplate(_product) {
    return `
      <div class="card mb-4">
        <img class="card-img-top" src="${_product.image}" alt="...">
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
          <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
          <p class="card-text mb-4" style="min-height: 82px">
            ${_product.description}             
          </p>
          <p class="card-text mb-4" style="min-height: 82px">
            owned by ${_product.owner}             
          </p>
          <p class="card-text mb-4" style="min-height: 82px">
            price: ${_product.price.shiftedBy(-ERC20_decimals).toFixed(2)}             
          </p>
          <p class="card-text mt-4">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${_product.location}</span>
          </p>
          ${buttonTemplate(_product)}
        </div>
      </div>
    `
}

function buttonTemplate(_product) {
    if (_product.owner == kit.defaultAccount) {
        return `
        <div class="d-grid gap-2">
        <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${_product.index
            } data-bs-toggle="modal" data-bs-target="#setPriceModal">
          Set price
        </a>
      </div>`
    }
    return `
    <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${_product.index
        }>
              Buy for ${_product.price.shiftedBy(-ERC20_decimals).toFixed(2)} cUSD

            </a>
          </div>`
}
function identiconTemplate(_address) {
    const icon = blockies
        .create({
            seed: _address,
            size: 8,
            scale: 16,
        })
        .toDataURL()

    return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
}

function notification(_text) {
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
}

function notificationOff() {
    document.querySelector(".alert").style.display = "none"
}

document.querySelector("#newProductBtn")
    .addEventListener("click", async (e) => {
        const params = [
            document.getElementById("newProductName").value,
            document.getElementById("newImgUrl").value,
            document.getElementById("newProductDescription").value,
            document.getElementById("newLocation").value,
            new BigNumber(document.getElementById("newPrice").value)
                .shiftedBy(ERC20_decimals)
                .toString(),
            true
        ]
        notification(`⌛ Adding "${params[0]}"...`)
        getJSONURI(...params)
    })

document.querySelector("#setPriceBtn").addEventListener("click", async (e) => {
    const price = document.getElementById("setPriceInput").value
    console.log("The new price should be", price)
    products.forEach((item) => {
        if (item.index == clickedProductIndex) {
            let currentProduct = products[clickedProductIndex]
            const params = [
                currentProduct.name,
                currentProduct.image,
                currentProduct.description,
                currentProduct.location,
                new BigNumber(price).shiftedBy(ERC20_decimals).toString(),
                false
            ]
            getJSONURI(...params)
        }
    })
})

document.querySelector("#marketplace").addEventListener("click", async (e) => {
    if (e.target.className.includes("buyBtn")) {
        const index = e.target.id
        clickedProductIndex = index
        console.log("Clicked product index is; ", clickedProductIndex)
        // const owner = products[index].owner
        // notification(`Waiting for payment approval.`)
        // try {
        //     // await approve(products[index].price)
        //     if (owner == kit.defaultAccount) {

        //     }
        // } catch (error) {
        //     notification(`Error: ${error}`)
        // }
        // notification(`Awaiting payment for ${products[index].name}`)
        // try {
        //     const result = await contract.methods.buyProduct(index).send({ from: kit.defaultAccount })
        //     notification(`Successfully bought ${products[index].name}`)
        //     getProducts()
        //     getBalance()
        // } catch (error) {
        //     notification(`Error: ${error}`)
        // }
    }
})

async function getJSONURI(name, imageURL, description, location, price, isNew) {
    //These are the api keys for using the Pinata API
    const pinata = pinataSdk('f2e0188887f4b5ae161f', '92ae688fbe61ce9abcf496ffee7efd82b56eeaf9838293b49e25134280f6cc53')

    pinata.testAuthentication().then((result) => {
        console.log(result)
    }).catch((error) => {
        console.log(error)
    })
    //Generating the JSON for the food NFT
    const body = {
        "name": name,
        "description": description,
        "image": imageURL,
        "location": location,
        "price": price
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
        return uri
    }).catch((error) => {
        console.log(error)
    }).then(async (uri) => {
        if (isNew) {
            try {
                // uri = getJSONURI(...params)
                const result = await nfftContract.methods.createNFT(uri).send({ from: kit.defaultAccount })
                notification(`🎉 You successfully added ${name}.`)
                getProducts()
            } catch (error) {
                notification(`⚠️ ${error}.`)
            }
        }
        else {
            try {
                // uri = getJSONURI(...params)
                const result = await nfftContract.methods.setTokenURI(clickedProductIndex, uri).send({ from: kit.defaultAccount })
                notification(`🎉 You successfully added ${name}.`)
                getProducts()
            } catch (error) {
                notification(`⚠️ ${error}.`)
            }
        }

    })
    return uri
}