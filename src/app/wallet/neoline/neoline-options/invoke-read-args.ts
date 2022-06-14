import TypedValue from "./typed-values";

type InvokeReadArgs = {
    scriptHash: string;
    operation: string;
    args: TypedValue[];
};

export default InvokeReadArgs; 