// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//ERC721URIStorage is the openzeppelin implementation of NFTs.
//Openzeppelin is a good library because they are always up to date with security risks
//and latest updates.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

//NFFT stands for Non Fungible Food Token
contract NFFT is ERC721URIStorage {
    uint256 public tokenId;

    constructor() ERC721("Non Fungible Food Token", "NFFT") {}

    function createNFT(string memory _tokenURI) public {
        //_safeMint generates the nft
        _safeMint(msg.sender, tokenId);

        //setTokenURI assigns a string(uri) to the specific token ID through a mapping
        setTokenURI(tokenId, _tokenURI);
        tokenId++;
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), _tokenId),
            "Error: Only the owner can change the token URI "
        );
        _setTokenURI(_tokenId, _tokenURI);
    }
}
