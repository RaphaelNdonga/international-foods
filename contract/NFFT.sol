// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFFT is ERC721 {
    uint256 public tokenId;

    constructor() ERC721("Non Fungible Food Token", "NFFT") {}

    function createNFT(string memory tokenURI) {
        _safeMint(msg.sender, tokenId);
        tokenId++;
    }
}
