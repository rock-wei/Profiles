const global = {
    log: 1, //日志模式:0不显示 1全部显示 2精简显示,推荐值:1
    parallel: false, //是否顺序签到(true则同时签到,可能会出现内存占用过高导致执行失败的情况;false则签到速度会慢一些,但是很稳)
    sign: { //用于设置哪些需要进行签到,哪些不处理
        baidu_tieba: true,
        iqiyi: true,
        _52pojie: true,
        netease_music: true,
        v2ex: false,
        china_telecom: false,
        rrtv: false,
        eleme: false
    },
    data: {
        china_telecom: "" //此处输入要签到的手机号码,半角双引号中间
    }
}

//#region smartjs,用于兼容Surge和QuantumultX

/*
本作品用于QuantumultX和Surge之间js执行方法的转换
您只需书写其中任一软件的js,然后在您的js最【前面】追加上此段js即可
无需担心影响执行问题,具体原理是将QX和Surge的方法转换为互相可调用的方法
尚未测试是否支持import的方式进行使用,因此暂未export
如有问题或您有更好的改进方案,请前往 https://github.com/sazs34/TaskConfig/issues 提交内容,或直接进行pull request
您也可直接在tg中联系@wechatu
*/
// #region 固定头部
let isQuantumultX = typeof $task != 'undefined'; //判断当前运行环境是否是qx
let isSurge = typeof $httpClient != 'undefined'; //判断当前运行环境是否是surge
let isRequest = typeof $request != "undefined"; //判断是否是请求
// http请求
var $task = isQuantumultX ? $task : {};
var $httpClient = isSurge ? $httpClient : {};
// cookie读写
var $prefs = isQuantumultX ? $prefs : {};
var $persistentStore = isSurge ? $persistentStore : {};
// 消息通知
var $notify = isQuantumultX ? $notify : {};
var $notification = isSurge ? $notification : {};


var done = (value = {}) => isQuantumultX ? (isRequest ? $done(value) : null) : ((isRequest ? $done(value) : $done()));
// #endregion 固定头部

// #region 网络请求专用转换
if (isQuantumultX) {
    var errorInfo = {
        error: ''
    };
    $httpClient = {
        get: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        },
        post: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            url.method = 'POST';
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        }
    }
}
if (isSurge) {
    $task = {
        fetch: url => {
            //为了兼容qx中fetch的写法,所以永不reject
            return new Promise((resolve, reject) => {
                if (url.method == 'POST') {
                    $httpClient.post(url, (error, response, data) => {
                        if (response) {
                            response.body = data;
                            resolve(response, {
                                error: error
                            });
                        } else {
                            resolve(null, {
                                error: error
                            })
                        }
                    })
                } else {
                    $httpClient.get(url, (error, response, data) => {
                        if (response) {
                            response.body = data;
                            resolve(response, {
                                error: error
                            });
                        } else {
                            resolve(null, {
                                error: error
                            })
                        }
                    })
                }
            })

        }
    }
}
// #endregion 网络请求专用转换

// #region cookie操作
if (isQuantumultX) {
    $persistentStore = {
        read: key => {
            return $prefs.valueForKey(key);
        },
        write: (val, key) => {
            return $prefs.setValueForKey(val, key);
        }
    }
}
if (isSurge) {
    $prefs = {
        valueForKey: key => {
            return $persistentStore.read(key);
        },
        setValueForKey: (val, key) => {
            return $persistentStore.write(val, key);
        }
    }
}
// #endregion

// #region 消息通知
//#endregion

//#endregion

let master = () => {
    if (typeof $request != "undefined") {
        getCookie();
    } else {
        execute();
    }
}

let getCookie = () => {
    //#region 基础配置
    const config = {
        baidu_tieba_h5: {
            cookie: 'CookieTB',
            name: '百度贴吧Cookie-H5',
            Host: 'tieba.baidu.com'
        },
        baidu_tieba_app: {
            cookie: 'CookieTB',
            name: '百度贴吧Cookie-App',
            Host: 'c.tieba.baidu.com'
        },
        iqiyi_app: {
            cookie: 'CookieQY',
            name: '爱奇艺Cookie-App',
            Host: 'passport.iqiyi.com'
        },
        _52pojie: {
            cookie: 'CookieWA',
            name: '吾爱破解Cookie',
            Host: 'www.52pojie.cn'
        },
        netease_music: {
            cookie: 'CookieWY',
            name: '网易云音乐Cookie',
            Host: 'music.163.com'
        },
        v2ex: {
            cookie: 'CookieV2ex',
            name: 'V2EX-Cookie',
            Host: 'www.v2ex.com'
        },
        jd: {
            cookie: 'CookieJD',
            name: '京东Cookie',
            Host: 'api.m.jd.com'
        },
        china_telecom: {
            cookie: 'cookie.10000',
            name: '电信营业厅',
            Host: 'wapside.189.cn'
        },
        eleme: {
            cookie: "CookieELM",
            name: '饿了么Cookie',
            Host: 'ele.me'
        },
        rrtv: {
            cookie: 'chavy_cookie_rrtv',
            name: '人人视频Cookie',
            Host: 'rr.tv'
        }
    }
    //#endregion

    //#region 查重方法,用于检测Cookie值是否发生变化以便于更新Cookie

    let updateCookie = (config, newVal) => {
        if (!newVal || !config) return;
        var historyCookie = $prefs.valueForKey(config.cookie);
        if (historyCookie) {
            if (historyCookie != newVal) {
                if ($prefs.setValueForKey(newVal, config.cookie)) {
                    $notify(`更新 ${config.name} 成功🎉`, "", "无需禁用脚本，仅Cookie改变时才会重新获取");
                } else {
                    $notify(`更新 ${config.name} 失败!!!`, "", "");
                }
            } else {
                //cookie未发生变化,不执行更新
            }
        } else {
            if ($prefs.setValueForKey(newVal, config.cookie)) {
                $notify(`首次写入 ${config.name} 成功🎉`, "", "无需禁用脚本，仅Cookie改变时才会重新获取");
            } else {
                $notify(`首次写入 ${config.name} 失败!!!`, "", "");
            }
        }
    }

    //#endregion

    //#region 正式开始写入cookie
    let request = $request;
    var isValidRequest = request && request.headers && request.headers.Cookie
    if (isValidRequest) {
        let headers = request.headers;
        // console.log(`【Cookie触发】${headers.Host}-${headers.Cookie}`)
        //#region 百度贴吧-H5
        if (headers.Host == config.baidu_tieba_h5.Host) {
            var regex = /(^|)BDUSS=([^;]*)(;|$)/;
            var matchInfo = headers.Cookie.match(regex);
            if (matchInfo) {
                var headerCookie = headers.Cookie.match(regex)[0];
                updateCookie(config.baidu_tieba_h5, headerCookie);
            }
        }
        //#endregion
        //#region 百度贴吧-APP
        if (headers.Host == config.baidu_tieba_app.Host) {
            var regex = /(^|)BDUSS=([^;]*)(;|$)/;
            var matchInfo = headers.Cookie.match(regex);
            if (matchInfo) {
                var headerCookie = headers.Cookie.match(regex)[0];
                updateCookie(config.baidu_tieba_app, headerCookie);
            }
        }
        //#endregion
        //#region 爱奇艺-APP
        if (headers.Host == config.iqiyi_app.Host) {
            var regex = /authcookie=([A-Za-z0-9]+)/;
            if (regex.test(request.url)) {
                var headerCookie = regex.exec(request.url)[1];
                updateCookie(config.iqiyi_app, headerCookie);
            }
        }
        //#endregion
        //#region 吾爱破解
        if (headers.Host == config._52pojie.Host) {
            var headerCookie = headers.Cookie;
            updateCookie(config._52pojie, headerCookie);
        }
        //#endregion
        //#region 网易云音乐
        if (headers.Host == config.netease_music.Host) {
            var headerCookie = headers.Cookie;
            //这个cookie很调皮,会将WM_TID放置到最前面一次,导致cookie会检测到变化,实际值始终是一样的
            if (headerCookie.indexOf("WM_TID=") > 0)
                updateCookie(config.netease_music, headerCookie);
        }
        //#endregion
        //#region V2EX
        if (headers.Host == config.v2ex.Host) {
            var headerCookie = headers.Cookie;
            updateCookie(config.v2ex, headerCookie);
        }
        //#endregion
        //#region 京东
        if (headers.Host == config.jd.Host) {
            var headerCookie = headers.Cookie;
            updateCookie(config.jd, headerCookie);
        }
        //#endregion
        //#region 中国电信
        if (headers.Host.indexOf(config.china_telecom.Host) >= 0) {
            var headerCookie = headers.Cookie;
            updateCookie(config.china_telecom, headerCookie);
        }
        //#endregion
        //#region 饿了么
        if (headers.Host.indexOf(config.eleme.Host) >= 0) {
            var headerCookie = headers.Cookie;
            var cookieVal = helper.getCookieByName(headerCookie, "USERID");
            updateCookie(config.eleme, cookieVal);
        }
        //#endregion
        //#region 人人视频
        if (headers.Host.indexOf(config.rrtv.Host) >= 0) {
            var headerToken = headers.token;
            updateCookie(config.rrtv, headerToken);
        }
        //#endregion
    }
    $done();

    //#endregion

}

let execute = () => {
    //#region 签到配置,请勿修改
    const config = {
        baidu_tieba: {
            cookie: 'CookieTB',
            name: '百度贴吧',
            provider: {
                list: {
                    url: "https://tieba.baidu.com/mo/q/newmoindex",
                    headers: {
                        "Content-Type": "application/octet-stream",
                        Referer: "https://tieba.baidu.com/index/tbwise/forum",
                        Cookie: '',
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366"
                    }
                },
                sign: {
                    url: "https://tieba.baidu.com/sign/add",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Cookie: '',
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_1_1 like Mac OS X; zh-CN) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/14B100 UCBrowser/10.7.5.650 Mobile"
                    },
                    body: ""
                }
            },
            data: {
                total: 0,
                progress: 0,
                result: [],
                notify: ''
            }
        },
        iqiyi: {
            cookie: 'CookieQY',
            name: '爱奇艺',
            provider: {
                url: 'https://tc.vip.iqiyi.com/taskCenter/task/queryUserTask?autoSign=yes&P00001='
            },
            data: {
                notify: ''
            }
        },
        _52pojie: {
            cookie: 'CookieWA',
            name: '吾爱破解',
            provider: {
                url: `https://www.52pojie.cn/home.php?mod=task&do=apply&id=2&mobile=no`,
                headers: {
                    Cookie: ''
                }
            },
            data: {
                notify: ''
            }
        },
        netease_music: {
            cookie: 'CookieWY',
            name: '网易云音乐',
            provider: {
                app: {
                    url: `http://music.163.com/api/point/dailyTask?type=0`,
                    headers: {
                        Cookie: ''
                    }
                },
                pc: {
                    url: `http://music.163.com/api/point/dailyTask?type=1`,
                    headers: {
                        Cookie: ''
                    }
                }
            },
            data: {
                app: '',
                pc: '',
                notify: ''
            }
        },
        v2ex: {
            cookie: 'CookieV2ex',
            name: 'V2EX',
            provider: {
                check: {
                    url: `https://www.v2ex.com/mission/daily`,
                    method: 'GET',
                    headers: {
                        Cookie: ''
                    }
                },
                sign: {
                    url: `https://www.v2ex.com/mission/daily/redeem?once=`,
                    method: 'GET',
                    headers: {
                        Cookie: ''
                    }
                }
            },
            data: {
                notify: ''
            }
        },
        china_telecom: {
            cookie: 'cookie.10000',
            name: '中国电信',
            provider: {
                url: 'https://wapside.189.cn:9001/api/home/sign',
                method: 'POST',
                headers: {
                    "Content-Type": `application/json;charset=utf-8`,
                    "User-Agent": `Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;CtClient;7.6.0;iOS;13.3;iPhone XR`,
                    "Host": `wapside.189.cn:9001`,
                    "Origin": `https://wapside.189.cn:9001`,
                    "Referer": `https://wapside.189.cn:9001/resources/dist/signInActivity.html?cmpid=jt-khd-my-zygn&ticket=0ab000281b4a8139f264620ae1d8b1ce067a6587921f90a6260dca4389a4e01a&version=7.6.0`,
                    Cookie: ''
                },
                body: JSON.stringify({
                    phone: global.data.china_telecom
                })
            },
            data: {
                notify: ''
            }
        },
        eleme: {
            cookie: 'CookieELM',
            name: '饿了么',
            provider: {
                sign: {
                    url: `https://h5.ele.me/restapi/member/v2/users/`,
                    method: 'POST',
                },
                check: {
                    url: `https://h5.ele.me/restapi/member/v1/users/`,
                    method: 'GET',
                },
                priz
