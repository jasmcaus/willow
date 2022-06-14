import { NeoLineN3Interface } from "./neoline-interface";

function NeoLineN3Init(): Promise<NeoLineN3Interface> {
    return new Promise((resolve, reject) => {
        window.addEventListener('NEOLine.N3.EVENT.READY', () => 
        {
            const neolineN3 = new (<any>window).NEOLineN3.Init();
            if (neolineN3) {
                resolve(neolineN3);
            } else {
                reject('N3 dAPI method failed to load.');
            }
        });
    });
}

export default NeoLineN3Init; 