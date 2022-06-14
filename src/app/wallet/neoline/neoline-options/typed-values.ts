type NeoType = 'String' | 'Boolean' | 'Hash160' | 'Hash256' | 'Integer' | 'ByteArray' | 'Array' | 'Address';

type TypedValue = { type: NeoType; value: any };

export default TypedValue; 