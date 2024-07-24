//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./WalletProxy.sol";
import "./MultiSigWallet.sol";

contract WalletFactory {
	function createWallet(
		address singleton,
		uint256 chainId,
		address[] memory owners,
		MultiSigWallet.Role[] memory roles,
		uint256 signaturesRequired
	) external returns (address) {
		// 生成salt
		bytes32 _salt = generateSalt(
			chainId,
			singleton,
			owners,
			roles,
			signaturesRequired
		);
		// 用create2部署新合约
		WalletProxy proxy = new WalletProxy{ salt: _salt }(singleton);
		// 调用新合约的initialize方法
		MultiSigWallet(payable(address(proxy))).init(
			chainId,
			owners,
			roles,
			signaturesRequired
		);
		// bytes4 selector = MultiSigWallet.init.selector;
		// bytes memory data = abi.encodeWithSelector(
		// 	selector,
		// 	chainId,
		// 	owners,
		// 	roles,
		// 	signaturesRequired
		// );
		// (bool success, ) = address(proxy).call(data);
		// require(success, "Initialize failed");
		return address(proxy);
	}

	function calculateAddress(
		address singleton,
		uint256 chainId,
		address[] memory owners,
		MultiSigWallet.Role[] memory roles,
		uint256 signaturesRequired
	) external view returns (address predictedAddress) {
		bytes32 _salt = generateSalt(
			chainId,
			singleton,
			owners,
			roles,
			signaturesRequired
		);
		// 计算合约地址方法 hash()
		bytes memory _encode = abi.encodePacked(
			bytes1(0xff),
			address(this),
			_salt,
			keccak256(getBytecode(singleton))
		);
		predictedAddress = address(uint160(uint256(keccak256(_encode))));
	}

	function generateSalt(
		uint256 chainId,
		address singleton,
		address[] memory owners,
		MultiSigWallet.Role[] memory roles,
		uint256 signaturesRequired
	) internal pure returns (bytes32 salt) {
		bytes memory packed = abi.encodePacked(
			chainId,
			singleton,
			owners,
			roles,
			signaturesRequired
		);
		salt = keccak256(packed);
	}

	function getBytecode(address singleton) public pure returns (bytes memory) {
		bytes memory bytecode = type(WalletProxy).creationCode;
		return abi.encodePacked(bytecode, abi.encode(singleton));
	}
}
