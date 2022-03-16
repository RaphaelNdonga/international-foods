import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import MarketPlaceAbi from '../contract/marketplace.abi.json'
import ERC20Abi from '../contract/erc20.abi.json'

const ERC20_decimals = 18

let kit
let contract
let products = []

window.addEventListener('load', async () => {
    notification("⌛ Loading...")
    await connectCeloWallet()
    await getBalance()
    await getProducts()
    notificationOff()
});

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

const MPContractAdress = "0x7a6eC3b07576000C740851aA71b3a5AfF82c67A4"
const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const NFFTAddress = "0x6a61e93437ed35a8f41f5eF0501839D46C55B1A9"

const getProducts = async function () {
    const productsLength = await contract.methods.getProductsLength().call()
    const _products = []

    for (let i = 0; i < productsLength; i++) {
        let _product = new Promise(async (resolve, reject) => {
            let p = await contract.methods.readProduct(i).call()
            resolve({
                index: i,
                owner: p[0],
                name: p[1],
                image: p[2],
                description: p[3],
                location: p[4],
                price: new BigNumber(p[5]),
                sold: p[6],
            })
        })
        _products.push(_product)
    }
    products = await Promise.all(_products)
    renderProducts()
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
        <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
          ${_product.sold} Sold
        </div>
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
          <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
          <p class="card-text mb-4" style="min-height: 82px">
            ${_product.description}             
          </p>
          <p class="card-text mt-4">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${_product.location}</span>
          </p>
          <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${_product.index
        }>
              Buy for ${_product.price.shiftedBy(-ERC20_decimals).toFixed(2)} cUSD
            </a>
          </div>
        </div>
      </div>
    `
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
                .toString()
        ]
        notification(`⌛ Adding "${params[0]}"...`)

        try {
            const result = await contract.methods.writeProduct(...params).send({ from: kit.defaultAccount })
        } catch (error) {
            notification(`⚠️ ${error}.`)
        }
        notification(`🎉 You successfully added ${params[0]}.`)
        getProducts()
    })

document.querySelector("#marketplace").addEventListener("click", async (e) => {
    if (e.target.className.includes("buyBtn")) {
        const index = e.target.id
        notification(`Waiting for payment approval.`)
        try {
            await approve(products[index].price)
        } catch (error) {
            notification(`Error: ${error}`)
        }
        notification(`Awaiting payment for ${products[index].name}`)
        try {
            const result = await contract.methods.buyProduct(index).send({ from: kit.defaultAccount })
            notification(`Successfully bought ${products[index].name}`)
            getProducts()
            getBalance()
        } catch (error) {
            notification(`Error: ${error}`)
        }
    }
})