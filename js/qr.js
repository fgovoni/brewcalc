// Gerador de QR Code — implementação embutida, sem CDN nem pacote externo.
//
// Código vendorizado: manipulação de bits e polinômios de Galois. Ele foi movido
// para cá tal como estava, incluindo os `var` — reescrever para const/let não traz
// nada e arrisca introduzir bug num algoritmo que não é trivial de reler. Se um dia
// precisar de conserto, trate como dependência: troque o bloco inteiro.

// ---------- Gerador de QR Code (embutido, sem dependências externas) ----------
// Implementação enxuta baseada no algoritmo público de QR Code (modo Byte,
// versões 1 a 10, nível de correção L) — suficiente para URLs curtas como
// as usadas para compartilhar receitas customizadas.
var qrcode = (function () {
    var QRMode = { MODE_8BIT_BYTE: 1 << 2 };
    var QRErrorCorrectionLevel = { L: 1, M: 0, Q: 3, H: 2 };
    var QRMaskPattern = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6, P7: 7 };

    // Centros dos padrões de alinhamento por versão (1 a 20)
    var PATTERN_POSITION_TABLE = [
        [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
        [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
        [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
        [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    function getBCHDigit(data) {
        var digit = 0;
        while (data !== 0) { digit += 1; data >>>= 1; }
        return digit;
    }

    var QRUtil = {
        getBCHTypeInfo: function (data) {
            var d = data << 10;
            while (getBCHDigit(d) - getBCHDigit(G15) >= 0) d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
            return ((data << 10) | d) ^ G15_MASK;
        },
        getBCHTypeNumber: function (data) {
            var d = data << 12;
            while (getBCHDigit(d) - getBCHDigit(G18) >= 0) d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
            return (data << 12) | d;
        },
        getPatternPosition: function (typeNumber) { return PATTERN_POSITION_TABLE[typeNumber - 1]; },
        getMaskFunction: function (maskPattern) {
            switch (maskPattern) {
                case QRMaskPattern.P0: return function (i, j) { return (i + j) % 2 === 0; };
                case QRMaskPattern.P1: return function (i, j) { return i % 2 === 0; };
                case QRMaskPattern.P2: return function (i, j) { return j % 3 === 0; };
                case QRMaskPattern.P3: return function (i, j) { return (i + j) % 3 === 0; };
                case QRMaskPattern.P4: return function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; };
                case QRMaskPattern.P5: return function (i, j) { return (i * j) % 2 + (i * j) % 3 === 0; };
                case QRMaskPattern.P6: return function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 === 0; };
                case QRMaskPattern.P7: return function (i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 === 0; };
                default: throw new Error('maskPattern:' + maskPattern);
            }
        },
        getErrorCorrectPolynomial: function (errorCorrectLength) {
            var a = qrPolynomial([1], 0);
            for (var i = 0; i < errorCorrectLength; i += 1) a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
            return a;
        },
        getLengthInBits: function (typeNumber) { return typeNumber < 10 ? 8 : 16; }, // modo Byte: 8 bits (v1–9) ou 16 bits (v10+)
        getLostPoint: function (qrCode) {
            var moduleCount = qrCode.getModuleCount();
            var lostPoint = 0;
            for (var row = 0; row < moduleCount; row += 1) {
                for (var col = 0; col < moduleCount; col += 1) {
                    var sameCount = 0;
                    var dark = qrCode.isDark(row, col);
                    for (var r = -1; r <= 1; r += 1) {
                        if (row + r < 0 || moduleCount <= row + r) continue;
                        for (var c = -1; c <= 1; c += 1) {
                            if (col + c < 0 || moduleCount <= col + c) continue;
                            if (r === 0 && c === 0) continue;
                            if (dark === qrCode.isDark(row + r, col + c)) sameCount += 1;
                        }
                    }
                    if (sameCount > 5) lostPoint += (3 + sameCount - 5);
                }
            }
            for (var row2 = 0; row2 < moduleCount - 1; row2 += 1) {
                for (var col2 = 0; col2 < moduleCount - 1; col2 += 1) {
                    var count = 0;
                    if (qrCode.isDark(row2, col2)) count += 1;
                    if (qrCode.isDark(row2 + 1, col2)) count += 1;
                    if (qrCode.isDark(row2, col2 + 1)) count += 1;
                    if (qrCode.isDark(row2 + 1, col2 + 1)) count += 1;
                    if (count === 0 || count === 4) lostPoint += 3;
                }
            }
            for (var row3 = 0; row3 < moduleCount; row3 += 1) {
                for (var col3 = 0; col3 < moduleCount - 6; col3 += 1) {
                    if (qrCode.isDark(row3, col3) && !qrCode.isDark(row3, col3 + 1) && qrCode.isDark(row3, col3 + 2) &&
                        qrCode.isDark(row3, col3 + 3) && qrCode.isDark(row3, col3 + 4) && !qrCode.isDark(row3, col3 + 5) &&
                        qrCode.isDark(row3, col3 + 6)) lostPoint += 40;
                }
            }
            for (var col4 = 0; col4 < moduleCount; col4 += 1) {
                for (var row4 = 0; row4 < moduleCount - 6; row4 += 1) {
                    if (qrCode.isDark(row4, col4) && !qrCode.isDark(row4 + 1, col4) && qrCode.isDark(row4 + 2, col4) &&
                        qrCode.isDark(row4 + 3, col4) && qrCode.isDark(row4 + 4, col4) && !qrCode.isDark(row4 + 5, col4) &&
                        qrCode.isDark(row4 + 6, col4)) lostPoint += 40;
                }
            }
            var darkCount = 0;
            for (var c5 = 0; c5 < moduleCount; c5 += 1) for (var r5 = 0; r5 < moduleCount; r5 += 1) if (qrCode.isDark(r5, c5)) darkCount += 1;
            lostPoint += Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5 * 10;
            return lostPoint;
        }
    };

    var QRMath = (function () {
        var EXP_TABLE = new Array(256), LOG_TABLE = new Array(256);
        for (var i = 0; i < 8; i += 1) EXP_TABLE[i] = 1 << i;
        for (var j = 8; j < 256; j += 1) EXP_TABLE[j] = EXP_TABLE[j - 4] ^ EXP_TABLE[j - 5] ^ EXP_TABLE[j - 6] ^ EXP_TABLE[j - 8];
        for (var k = 0; k < 255; k += 1) LOG_TABLE[EXP_TABLE[k]] = k;
        return {
            glog: function (n) { if (n < 1) throw new Error('glog(' + n + ')'); return LOG_TABLE[n]; },
            gexp: function (n) { while (n < 0) n += 255; while (n >= 256) n -= 255; return EXP_TABLE[n]; }
        };
    })();

    function qrPolynomial(num, shift) {
        var offset = 0;
        while (offset < num.length && num[offset] === 0) offset += 1;
        var _num = new Array(num.length - offset + shift);
        for (var i = 0; i < num.length - offset; i += 1) _num[i] = num[i + offset];
        return {
            getAt: function (index) { return _num[index]; },
            getLength: function () { return _num.length; },
            multiply: function (e) {
                var self = this;
                var out = new Array(self.getLength() + e.getLength() - 1);
                for (var i = 0; i < out.length; i += 1) out[i] = 0;
                for (var i2 = 0; i2 < self.getLength(); i2 += 1) {
                    for (var j2 = 0; j2 < e.getLength(); j2 += 1) {
                        out[i2 + j2] ^= QRMath.gexp(QRMath.glog(self.getAt(i2)) + QRMath.glog(e.getAt(j2)));
                    }
                }
                return qrPolynomial(out, 0);
            },
            mod: function (e) {
                var self = this;
                if (self.getLength() - e.getLength() < 0) return self;
                var ratio = QRMath.glog(self.getAt(0)) - QRMath.glog(e.getAt(0));
                var num2 = new Array(self.getLength());
                for (var i = 0; i < self.getLength(); i += 1) num2[i] = self.getAt(i);
                for (var i2 = 0; i2 < e.getLength(); i2 += 1) num2[i2] ^= QRMath.gexp(QRMath.glog(e.getAt(i2)) + ratio);
                return qrPolynomial(num2, 0).mod(e);
            }
        };
    }

    // Blocos Reed-Solomon [contagem, total, dados] por versão (1–20), nível L.
    // Estes números vêm do padrão ISO/IEC 18004 e NÃO devem ser editados à mão:
    // um erro aqui gera um QR de aparência perfeita que nenhum leitor consegue
    // ler. Foram conferidos decodificando os QR gerados com um leitor externo.
    var RS_BLOCK_TABLE_L = [
        [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
        [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 86, 68, 2, 87, 69],
        [4, 101, 81], [2, 116, 92, 2, 117, 93], [4, 133, 107], [3, 145, 115, 1, 146, 116],
        [5, 109, 87, 1, 110, 88], [5, 122, 98, 1, 123, 99], [1, 135, 107, 5, 136, 108],
        [5, 150, 120, 1, 151, 121], [3, 141, 113, 4, 142, 114], [3, 135, 107, 5, 136, 108]
    ];

    function getRSBlocks(typeNumber) {
        var rsBlock = RS_BLOCK_TABLE_L[typeNumber - 1];
        var length = rsBlock.length / 3;
        var list = [];
        for (var i = 0; i < length; i += 1) {
            var count = rsBlock[i * 3 + 0], totalCount = rsBlock[i * 3 + 1], dataCount = rsBlock[i * 3 + 2];
            for (var j = 0; j < count; j += 1) list.push({ totalCount: totalCount, dataCount: dataCount });
        }
        return list;
    }

    function qrBitBuffer() {
        var _buffer = [], _length = 0;
        return {
            getBuffer: function () { return _buffer; },
            getLengthInBits: function () { return _length; },
            put: function (num, length) {
                for (var i = 0; i < length; i += 1) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
            },
            putBit: function (bit) {
                var bufIndex = Math.floor(_length / 8);
                if (_buffer.length <= bufIndex) _buffer.push(0);
                if (bit) _buffer[bufIndex] |= (0x80 >>> (_length % 8));
                _length += 1;
            }
        };
    }

    function qr8BitByte(data) {
        var bytes = [];
        var utf8 = unescape(encodeURIComponent(data));
        for (var i = 0; i < utf8.length; i += 1) bytes.push(utf8.charCodeAt(i) & 0xff);
        return {
            getLength: function () { return bytes.length; },
            write: function (buffer) { for (var i = 0; i < bytes.length; i += 1) buffer.put(bytes[i], 8); }
        };
    }

    function qrcodeFactory(typeNumber, errorCorrectionLevel) {
        var PAD0 = 0xEC, PAD1 = 0x11;
        var _typeNumber = typeNumber;
        var _moduleCount = 0;
        var _modules = null;
        var _dataList = [];
        var _dataCache = null;
        var _this = {};

        function setupPositionProbePattern(row, col) {
            for (var r = -1; r <= 7; r += 1) {
                if (row + r <= -1 || _moduleCount <= row + r) continue;
                for (var c = -1; c <= 7; c += 1) {
                    if (col + c <= -1 || _moduleCount <= col + c) continue;
                    if ((0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                        _modules[row + r][col + c] = true;
                    } else {
                        _modules[row + r][col + c] = false;
                    }
                }
            }
        }

        function setupTimingPattern() {
            for (var r = 8; r < _moduleCount - 8; r += 1) { if (_modules[r][6] == null) _modules[r][6] = (r % 2 === 0); }
            for (var c = 8; c < _moduleCount - 8; c += 1) { if (_modules[6][c] == null) _modules[6][c] = (c % 2 === 0); }
        }

        function setupPositionAdjustPattern() {
            var pos = QRUtil.getPatternPosition(_typeNumber);
            for (var i = 0; i < pos.length; i += 1) {
                for (var j = 0; j < pos.length; j += 1) {
                    var row = pos[i], col = pos[j];
                    if (_modules[row][col] != null) continue;
                    for (var r = -2; r <= 2; r += 1) {
                        for (var c = -2; c <= 2; c += 1) {
                            _modules[row + r][col + c] = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0));
                        }
                    }
                }
            }
        }

        function setupTypeNumber(test) {
            var bits = QRUtil.getBCHTypeNumber(_typeNumber);
            for (var i = 0; i < 18; i += 1) {
                var mod = (!test && ((bits >> i) & 1) === 1);
                _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
            }
            for (var i2 = 0; i2 < 18; i2 += 1) {
                var mod2 = (!test && ((bits >> i2) & 1) === 1);
                _modules[i2 % 3 + _moduleCount - 8 - 3][Math.floor(i2 / 3)] = mod2;
            }
        }

        function setupTypeInfo(test, maskPattern) {
            var data = (QRErrorCorrectionLevel.L << 3) | maskPattern;
            var bits = QRUtil.getBCHTypeInfo(data);
            for (var i = 0; i < 15; i += 1) {
                var mod = (!test && ((bits >> i) & 1) === 1);
                if (i < 6) _modules[i][8] = mod;
                else if (i < 8) _modules[i + 1][8] = mod;
                else _modules[_moduleCount - 15 + i][8] = mod;
            }
            for (var i2 = 0; i2 < 15; i2 += 1) {
                var mod2 = (!test && ((bits >> i2) & 1) === 1);
                if (i2 < 8) _modules[8][_moduleCount - i2 - 1] = mod2;
                else if (i2 < 9) _modules[8][15 - i2 - 1 + 1] = mod2;
                else _modules[8][15 - i2 - 1] = mod2;
            }
            _modules[_moduleCount - 8][8] = !test;
        }

        function mapData(data, maskPattern) {
            var inc = -1, row = _moduleCount - 1, bitIndex = 7, byteIndex = 0;
            var maskFunc = QRUtil.getMaskFunction(maskPattern);
            for (var col = _moduleCount - 1; col > 0; col -= 2) {
                if (col === 6) col -= 1;
                while (true) {
                    for (var c = 0; c < 2; c += 1) {
                        if (_modules[row][col - c] == null) {
                            var dark = false;
                            if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
                            if (maskFunc(row, col - c)) dark = !dark;
                            _modules[row][col - c] = dark;
                            bitIndex -= 1;
                            if (bitIndex === -1) { byteIndex += 1; bitIndex = 7; }
                        }
                    }
                    row += inc;
                    if (row < 0 || _moduleCount <= row) { row -= inc; inc = -inc; break; }
                }
            }
        }

        function createBytes(buffer, rsBlocks) {
            var offset = 0, maxDcCount = 0, maxEcCount = 0;
            var dcdata = new Array(rsBlocks.length), ecdata = new Array(rsBlocks.length);
            for (var r = 0; r < rsBlocks.length; r += 1) {
                var dcCount = rsBlocks[r].dataCount, ecCount = rsBlocks[r].totalCount - dcCount;
                maxDcCount = Math.max(maxDcCount, dcCount);
                maxEcCount = Math.max(maxEcCount, ecCount);
                dcdata[r] = new Array(dcCount);
                for (var i = 0; i < dcdata[r].length; i += 1) dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
                offset += dcCount;
                var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
                var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);
                var modPoly = rawPoly.mod(rsPoly);
                ecdata[r] = new Array(rsPoly.getLength() - 1);
                for (var i2 = 0; i2 < ecdata[r].length; i2 += 1) {
                    var modIndex = i2 + modPoly.getLength() - ecdata[r].length;
                    ecdata[r][i2] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0;
                }
            }
            var totalCodeCount = 0;
            for (var t = 0; t < rsBlocks.length; t += 1) totalCodeCount += rsBlocks[t].totalCount;
            var out = new Array(totalCodeCount), index = 0;
            for (var i3 = 0; i3 < maxDcCount; i3 += 1) for (var r2 = 0; r2 < rsBlocks.length; r2 += 1) if (i3 < dcdata[r2].length) out[index++] = dcdata[r2][i3];
            for (var i4 = 0; i4 < maxEcCount; i4 += 1) for (var r3 = 0; r3 < rsBlocks.length; r3 += 1) if (i4 < ecdata[r3].length) out[index++] = ecdata[r3][i4];
            return out;
        }

        function createData(typeNumber, dataList) {
            var rsBlocks = getRSBlocks(typeNumber);
            var buffer = qrBitBuffer();
            for (var i = 0; i < dataList.length; i += 1) {
                var data = dataList[i];
                buffer.put(QRMode.MODE_8BIT_BYTE, 4);
                buffer.put(data.getLength(), QRUtil.getLengthInBits(typeNumber));
                data.write(buffer);
            }
            var totalDataCount = 0;
            for (var j = 0; j < rsBlocks.length; j += 1) totalDataCount += rsBlocks[j].dataCount;
            if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error('code length overflow');
            if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
            while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
            while (true) {
                if (buffer.getLengthInBits() >= totalDataCount * 8) break;
                buffer.put(PAD0, 8);
                if (buffer.getLengthInBits() >= totalDataCount * 8) break;
                buffer.put(PAD1, 8);
            }
            return createBytes(buffer, rsBlocks);
        }

        function makeImpl(test, maskPattern) {
            _moduleCount = _typeNumber * 4 + 17;
            _modules = [];
            for (var row = 0; row < _moduleCount; row += 1) {
                _modules[row] = [];
                for (var col = 0; col < _moduleCount; col += 1) _modules[row][col] = null;
            }
            setupPositionProbePattern(0, 0);
            setupPositionProbePattern(_moduleCount - 7, 0);
            setupPositionProbePattern(0, _moduleCount - 7);
            setupPositionAdjustPattern();
            setupTimingPattern();
            setupTypeInfo(test, maskPattern);
            if (_typeNumber >= 7) setupTypeNumber(test);
            if (_dataCache == null) _dataCache = createData(_typeNumber, _dataList);
            mapData(_dataCache, maskPattern);
        }

        function getBestMaskPattern() {
            var minLostPoint = 0, pattern = 0;
            for (var i = 0; i < 8; i += 1) {
                makeImpl(true, i);
                var lostPoint = QRUtil.getLostPoint(_this);
                if (i === 0 || minLostPoint > lostPoint) { minLostPoint = lostPoint; pattern = i; }
            }
            return pattern;
        }

        _this.addData = function (data) { _dataList.push(qr8BitByte(data)); _dataCache = null; };
        _this.isDark = function (row, col) { return _modules[row][col]; };
        _this.getModuleCount = function () { return _moduleCount; };
        _this.make = function () { makeImpl(false, getBestMaskPattern()); };

        return _this;
    }

    return function (typeNumber) { return qrcodeFactory(typeNumber, 'L'); };
})();

export { qrcode };
