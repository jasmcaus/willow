export interface Token {
    id: number,
    name: string,
    symbol: string,
    logo_uri: string,
    decimals: number,
    balance: number,
    scriptHash?: string | undefined
}

const WillowToken: Token = {
    id: 0,
    name: "Willow",
    symbol: "WLT",
    logo_uri: "assets/tokens/Willow.svg",
    decimals: 8,
    balance: 0
}

const KangarooToken: Token = {
    id: 1,
    name: "Kangaroo",
    symbol: "KGR",
    logo_uri: "assets/tokens/Kangaroo.svg",
    decimals: 8,
    balance: 0
}

const DeerToken: Token = {
    id: 2,
    name: "Deer",
    symbol: "DET",
    logo_uri: "assets/tokens/Deer.svg",
    decimals: 8,
    balance: 0
}

const UFOToken: Token = {
    id: 3,
    name: "UFO",
    symbol: "UFO",
    logo_uri: "assets/tokens/UFO.svg",
    decimals: 8,
    balance: 0
}

const DoggyCoinToken: Token = {
    id: 4,
    name: "Doggy Coin",
    symbol: "DCT",
    logo_uri: "assets/tokens/DoggyCoin.svg",
    decimals: 8,
    balance: 0
}

const ParrotToken: Token = {
    id: 5,
    name: "Parrot",
    symbol: "PRT",
    logo_uri: "assets/tokens/Parrot.svg",
    decimals: 8,
    balance: 0
}


export const TOKENLIST: Token[] = [
    WillowToken,
    KangarooToken,
    DeerToken,
    UFOToken,
    DoggyCoinToken,
    ParrotToken
]


export function get_deets_from_token_id(token_id: number) {
    for(const token of TOKENLIST) {
        if(token.id === token_id) {
            return token
        }
    }
    return undefined
}

export const FAUCET_TOKENS = [
    {
        id: 0,
        name: "Willow",
        symbol: "WLT",
        logo_uri: "assets/tokens/Willow.svg",
        decimals: 8,
        amount_to_issue: 10_000_000_000_000_000,
        total_supply: 10_000_000_000_000_000_000_000
    },
    {
        id: 1,
        name: "Kangaroo",
        symbol: "KGR",
        logo_uri: "assets/tokens/Kangaroo.svg",
        decimals: 8,
        amount_to_issue: 40_000_000,
        total_supply: 100_000_000_000
    },
    {
        id: 2,
        name: "Deer",
        symbol: "DET",
        logo_uri: "assets/tokens/Deer.svg",
        decimals: 8,
        amount_to_issue: 600_000_000,
        total_supply: 100_000_000_000
    },
    {
        id: 3,
        name: "UFO",
        symbol: "UFO",
        logo_uri: "assets/tokens/UFO.svg",
        decimals: 8,
        amount_to_issue: 150_000_000,
        total_supply: 100_000_000_000
    },
    {
        id: 4,
        name: "Doggy Coin",
        symbol: "DCT",
        logo_uri: "assets/tokens/DoggyCoin.svg",
        decimals: 8,
        amount_to_issue: 1000_000,
        total_supply: 100_000_000_000
    },
    {
        id: 5,
        name: "Parrot",
        symbol: "PRT",
        logo_uri: "assets/tokens/Parrot.svg",
        decimals: 8,
        amount_to_issue: 230_000_000,
        total_supply: 100_000_000_000
    }
]