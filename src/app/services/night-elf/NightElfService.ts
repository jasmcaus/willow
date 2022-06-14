import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable } from "rxjs"
import AElf from "aelf-sdk"
const local_storage_address = "willow-aelf-address"


@Injectable({providedIn: "root"})
export class NightElfService {
    private aelf: any
    private aelf_address = new BehaviorSubject<string>("")
    aelf_address$ = this.aelf_address.asObservable()
    wallet: { address: string } = { address: "" }

    chain_status: any
    genesis_contract_address: string = ""
    zero_contract: any
    token_contract_address: string = ""

    CONTRACT_ADDRESS = "2VZL7cJVJ15QEq6gMfaavNcqMrfqVJZGMdHkiufFCEef4j9uhT"
    contract: any
    
    constructor(
    ) { }

    ngOnInit() {
        const _ = this.get_aelf_address()
    }


    get_aelf_address(): string {
        let address = this.aelf_address.value
        if(!address) {
            address = localStorage.getItem(local_storage_address) || ""
            this.aelf_address.next(address)
        }

        return address;
    }


    async get_contract() {
        const address = this.get_aelf_address()
        const aelf = this.detect_nightelf()
        console.log("AELF:", aelf)
        const chain_status = await this.aelf.chain.getChainStatus()
        console.log("chain_status:", chain_status)
        const genesis_contract_address = chain_status.GenesisContractAddress
        console.log("genesis_contract_address:", genesis_contract_address)
        const zero_contract = await this.aelf.chain.contractAt(genesis_contract_address, this.wallet)
        console.log("zero_contract:", zero_contract)
        const token_contract_address = await zero_contract.GetContractAddressByName.call(
            AElf.utils.sha256("AElf.ContractNames.Token")
        )
        console.log("token_contract_address:", token_contract_address)

        this.contract = await aelf.chain.contractAt(this.CONTRACT_ADDRESS, {address: address})
        console.log("Got contract: ", this.contract)
        return this.contract
    }


    get_shortened_address() {
        const address = this.get_aelf_address()
        return `${address.slice(0, 3)}...${address.slice(
            address.length - 3,
            address.length
        )}`
    }

    set_aelf_address(address: string): void {
        localStorage.setItem(local_storage_address, address)
        this.aelf_address.next(address)
        this.wallet = {
            address: address
        }
    }

    logout_aelf() {
        localStorage.removeItem(local_storage_address)
        this.aelf_address.next("")
        location.reload()
    }


    detect_nightelf() {
        const aelf_node_url = "https://tdvw-test-node.aelf.io"

        const check = new Promise((resolve, reject) => {
            if ((window as any).NightElf) {
                resolve("NightElf Ready")
            }
            setTimeout(() => {
                reject({
                    error: 200001,
                    message: 'timeout. Cannot find NightElf. Please install the extension'
                })
            }, 2000)
        })

        let aelf: any
        do {
            aelf = new (window as any).NightElf.AElf({
                httpProvider: [aelf_node_url],
                appName: "Willow",
                pure: true
            })
        } while (!aelf)

        this.aelf = aelf
        return aelf
    }


    async login() {
        if (!this.aelf) {
            this.aelf = this.detect_nightelf()
        }

        localStorage.removeItem(local_storage_address)
        const result = await this.aelf.login({
            chainId: "AElf",
            payload: {
                method: "LOGIN"
            }
        })

        const address = JSON.parse(result.detail).address as string
        this.set_aelf_address(address)


        const chain_status = await this.aelf.chain.getChainStatus()
        const genesis_contract_address = chain_status.GenesisContractAddress
        const zero_contract = await this.aelf.chain.contractAt(genesis_contract_address, this.wallet)
        const token_contract_address = await zero_contract.GetContractAddressByName.call(
            AElf.utils.sha256("AElf.ContractNames.Token")
        )

        this.chain_status = chain_status
        this.genesis_contract_address = genesis_contract_address
        this.zero_contract = zero_contract
        this.token_contract_address = token_contract_address
        this.contract = await this.aelf.chain.contractAt(this.CONTRACT_ADDRESS, this.wallet)
        console.log("Contract:", this.contract)
        console.log("Contract leys:", Object.keys(this.contract))
        console.log("Contract faucet:", this.contract["faucet"])

        return this.aelf_address.value
    }

}