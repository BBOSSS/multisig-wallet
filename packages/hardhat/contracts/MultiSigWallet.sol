//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract MultiSigWallet is EIP712 {
	using ECDSA for bytes32;
	enum Role {
		Default,
		Admin, // can execute and sign transaction
		Signer // can sign transaction
	}

	// Events: a way to emit log statements from smart contract that can be listened to by external parties
	event Deposit(address indexed sender, uint256 amount, uint256 balance);
	event Withdraw(address indexed to, uint256 amount, uint256 balance);
	event AddOwner(address indexed owner, Role role);
	event RemoveOwner(address indexed owner, Role role);
	event ExecuteTransaction(
		address indexed owner,
		address payable to,
		uint256 value,
		bytes data,
		uint256 nonce,
		bytes32 _hash,
		bytes result
	);
	event SignMsg(bytes32 indexed msgHash);

	// State Variables
	address internal singleton; // slot 0 for proxy
	address internal factory; // slot 1 for factory
	uint256 private totalSigner;
	uint256 private adminCount;
	uint256 private signaturesRequired;
	uint256 private nonce;
	uint256 private chainId;
	mapping(address => bool) private ownerMap;
	mapping(address => Role) private roleMap;
	mapping(bytes32 => bool) private signedMsgMap;
	bool private initialized;
	// keccak256("Transaction(uint256 _nonce,address to,uint256 value,bytes data)");
	bytes32 private constant TX_TYPEHASH =
		0xfe9232f930a1888451a774c0b727018ef25ecd765eb13538f36e68d536913ef8;

	// Constructor: Called once on contract deployment
	constructor() EIP712("MultiSigWallet", "1") {
		singleton = address(this);
		factory = msg.sender;
	}

	modifier onlySelf() {
		require(msg.sender == address(this), "Not self");
		_;
	}

	function init(
		uint256 _chainId,
		address[] memory owners,
		Role[] memory roles,
		uint256 _signaturesRequired
	) public {
		require(!initialized, "Already initialized");
		initialized = true;
		require(msg.sender == factory, "Not Creator");
		require(
			owners.length == roles.length,
			"Owners length don't match roles length"
		);
		require(
			_signaturesRequired <= owners.length && _signaturesRequired > 0,
			"signaturesRequired must in (0, totalSigner]"
		);
		totalSigner = owners.length;
		signaturesRequired = _signaturesRequired;
		for (uint256 i = 0; i < totalSigner; i++) {
			address addr = owners[i];
			require(!ownerMap[addr], "duplicate owner");
			ownerMap[addr] = true;
			roleMap[addr] = roles[i];
			if (roles[i] == Role.Admin) {
				adminCount++;
			}
			emit AddOwner(addr, roles[i]);
		}
		require(adminCount > 0, "There must be at least one admin");
		chainId = _chainId;
	}

	// create or update
	function addOwner(
		address addr,
		Role role,
		uint256 _signaturesRequired
	) public onlySelf {
		if (!ownerMap[addr]) {
			totalSigner += 1;
		}
		require(
			_signaturesRequired <= totalSigner && _signaturesRequired > 0,
			"signaturesRequired must in (0, totalSigner]"
		);
		signaturesRequired = _signaturesRequired;
		ownerMap[addr] = true;
		roleMap[addr] = role;
		if (role == Role.Admin) {
			adminCount++;
		}
		emit AddOwner(addr, role);
	}

	function removeOwner(
		address addr,
		uint256 _signaturesRequired
	) public onlySelf {
		require(ownerMap[addr], "Not Owner");
		require(totalSigner > 1, "Keep at least 1 owner");
		totalSigner -= 1;

		if (roleMap[addr] == Role.Admin) {
			adminCount--;
			require(adminCount > 0, "There must be at least one admin");
		}

		require(
			_signaturesRequired <= totalSigner && _signaturesRequired > 0,
			"signaturesRequired must in (0, totalSigner]"
		);
		signaturesRequired = _signaturesRequired;
		delete ownerMap[addr];
		Role role = roleMap[addr];
		delete roleMap[addr];
		emit RemoveOwner(addr, role);
	}

	function getTransactionStructHash(
		uint256 _nonce,
		address to,
		uint256 value,
		bytes memory data
	) public view returns (bytes32) {
		bytes32 structHash = keccak256(
			abi.encode(TX_TYPEHASH, _nonce, to, value, keccak256(data))
		);
		return _hashTypedDataV4(structHash);
	}

	function executeTransaction(
		uint256 _nonce,
		address payable to,
		uint256 value,
		bytes memory data,
		bytes[] memory signatures
	) public returns (bytes memory) {
		require(
			ownerMap[msg.sender] && roleMap[msg.sender] == Role.Admin,
			"executeTransaction: only admin can execute"
		);
		bytes32 _hash = getTransactionStructHash(_nonce, to, value, data);
		nonce++;
		address preAddr;
		uint256 validSignatures = 0;
		for (uint256 i = 0; i < signatures.length; i++) {
			address addr = recover(_hash, signatures[i]);
			require(
				addr > preAddr,
				"executeTransaction: duplicate or unordered signatures"
			);
			if (!ownerMap[addr]) {
				continue;
			}
			validSignatures++;
			preAddr = addr;
		}
		require(
			validSignatures >= signaturesRequired,
			"executeTransaction: not enough valid signatures"
		);

		(bool success, bytes memory result) = to.call{ value: value }(data);
		require(success, "executeTransaction: tx failed");

		emit ExecuteTransaction(
			msg.sender,
			to,
			value,
			data,
			nonce - 1,
			_hash,
			result
		);
		return result;
	}

	function recover(
		bytes32 _hash,
		bytes memory _signature
	) public pure returns (address) {
		// return _hash.toEthSignedMessageHash().recover(_signature);
		return ECDSA.recover(_hash, _signature);
	}

	/**
	 * Function that allows the owner to withdraw all the Ether in the contract
	 * The function can only be called by the owner of the contract as defined by the isOwner modifier
	 */
	function withdraw(address to, uint256 amount) public onlySelf {
		uint256 balance = address(this).balance;
		require(amount <= balance, "Insufficient balance");
		(bool success, ) = payable(to).call{ value: balance }("");
		require(success, "Failed to send Ether");
		emit Withdraw(to, amount, address(this).balance);
	}

	function getTotalSigner() public view returns (uint256) {
		return totalSigner;
	}

	function getAdminCount() public view returns (uint256) {
		return adminCount;
	}

	function getSignaturesRequired() public view returns (uint256) {
		return signaturesRequired;
	}

	function getNonce() public view returns (uint256) {
		return nonce;
	}

	function getChainId() public view returns (uint256) {
		return chainId;
	}

	function isOwner(address addr) public view returns (bool) {
		return ownerMap[addr];
	}

	function getRole(address addr) public view returns (Role) {
		// require(isOwner(addr), "Not owner");
		return roleMap[addr];
	}

	function getTransactionTypeHash() public pure returns (bytes32) {
		return TX_TYPEHASH;
	}

	/**
	 * Function that allows the contract to receive ETH
	 */
	receive() external payable {
		emit Deposit(msg.sender, msg.value, address(this).balance);
	}
}
