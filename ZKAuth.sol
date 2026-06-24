// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface untuk memanggil fungsi verifikasi dari Verifier.sol
interface ICircomVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[1] calldata input
    ) external view returns (bool r);
}

contract ZKAuth {
    address public verifierAddress;

    // Mapping untuk menyimpan username -> hash password yang terdaftar
    mapping(string => uint256) public registeredHashes;

    event UserRegistered(string username, uint256 identityCommitment);
    event LoginSuccess(string username);
    event LoginFailed(string username);

    // Alamat Verifier.sol dimasukkan saat deploy contract ini
    constructor(address _verifierAddress) {
        verifierAddress = _verifierAddress;
    }

    // 1. Fungsi Registrasi: Menyimpan hash password user ke blockchain
    function register(string memory _username, uint256 _identityCommitment) public {
        require(registeredHashes[_username] == 0, "Username sudah terdaftar!");
        registeredHashes[_username] = _identityCommitment;
        emit UserRegistered(_username, _identityCommitment);
    }

    // 2. Fungsi Login: Memvalidasi password menggunakan Zero-Knowledge Proof tanpa membeberkan password asli
    function login(
        string memory _username,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[1] calldata input
    ) public returns (bool) {
        // Pastikan user sudah terdaftar dan mencocokkan public input (expectedHash) di sirkuit
        require(registeredHashes[_username] != 0, "User belum terdaftar!");
        require(registeredHashes[_username] == input[0], "Hash identitas tidak cocok!");

        // Memanggil contract Verifier untuk mengecek kevalidan proof matematika ZKP
        bool isValid = ICircomVerifier(verifierAddress).verifyProof(a, b, c, input);

        if (isValid) {
            emit LoginSuccess(_username);
            return true;
        } else {
            emit LoginFailed(_username);
            return false;
        }
    }
}
