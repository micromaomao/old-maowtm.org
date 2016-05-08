var gpgKeyInfo = function(keyhash) {
    if(keyhash == '67B4ECEA') {
        return {
            id: 'A6B2F2B067B4ECEA',
            hash: '67B4ECEA',
            name: 'Wang Ting Mao',
            algo: '2048-RSA',
            expire: 'Never',
            date: '2015-11-22',
            nick: 'Wtm/Tim/Mao'
        };
    }
    if(keyhash == '2B5AF3B7') {
        return {
            id: '1D264E322B5AF3B7',
            hash: '2B5AF3B7',
            name: 'Wtm mao',
            algo: '4096-RSA',
            expire: 'Never',
            date: '2015-05-15',
            nick: 'Key use for encrypt my personal files. You can also use this to encrypt files send to me.'
        };
    }
    if(keyhash == '32DE725D') {
        return {
            id: '2AE8248632DE725D',
            hash: '32DE725D',
            name: '庭茂 王',
            algo: '4096-RSA',
            expire: 'Never',
            date: '2015-03-26',
            nick: 'Wtm/Mao/Micromaomao/王庭茂/可乐'
        };
    }
    throw new gpgKeyInfo.notFindError(keyhash);
};
gpgKeyInfo.notFindError = function(keyhash) {
    this.keyhash = keyhash;
};
gpgKeyInfo.notFindError.prototype.toString = function () {
    return "Key " + this.keyhash + " not find.";
};

module.exports = gpgKeyInfo;
