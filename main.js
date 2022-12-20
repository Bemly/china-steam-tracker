runtime.loadJar("./jxl.jar")

importClass("java.io.File")
importClass("java.io.IOException")
importClass("jxl.Workbook")
importClass("jxl.write.Label")
importClass("jxl.write.WritableSheet")
importClass("jxl.write.WritableWorkbook")
importClass("jxl.write.WriteException")
importClass("jxl.write.WritableCellFormat")
importClass("jxl.Cell")
importClass("jxl.Sheet")
importClass("jxl.CellType")

let priceDic = {};
let whatime = new Date();
whatime = [+whatime.getFullYear(), +whatime.getMonth() + 1, +whatime.getDate()];
let filePath = engines.myEngine().cwd();
let url = 'https://store.steamchina.com/search/results/?';
let url$arg = {
    count : 100,
    start : 0,
    category : "998%2C994"
}
//count=100&start=1&category1=998%2C994&infinite=1
//个数 开始 筛选 用json返回

function readJSON(path) {
  let j;
  try {
    path === undefined ? j = files.read(filePath + "/priceSheet.json") : j = files.read(path);
    log("找到上一次JSON，正在转换为对象以便导入");
    return JSON.parse(j);
  } catch (e) {
    log("没有文件，执行创建操作");
    return {};
  }
}
function writeJSON(path) {
  let j = JSON.stringify(JSONformat(getDataUrl(url, url$arg, [], 0)));
  log("正在把对象转换为JSON");
  path === undefined ? files.write(filePath + "/priceSheet.json", j) : files.write(path, j);
  log("正在写入新文件");
}

function timeCompare(time) {
  for (let ind = 0; ind < whatime.length; ind++) {
    if (whatime[ind] !== time[ind]) return false;
  }
  return true;
}

function HTMLformat(xhr) {
  log("格式化HTML内容为数组");
    //网页格式化工具 返回数组
    /*正则等量提取法 不支持犀牛
    xhr.results_html.exec(/<a href=\\\"https:\\\/\\\/store.steamchina.com\\\/app\\\/.*?\\\/.*?\/\?snr=.*?\\\"\\r\\n\\t\\t\\t data-ds-appid=\\\".*?\\\" data-ds-itemkey=\\\"App_.*?\\\" data-ds-tagids=\\\"\[.*?\]\\\" .*?class=\\\"title\\\">.*?<\\\/span>.*?search_released.*?\\\">.*?<\\\/div>.*?data-tooltip-html=\\\".*?。\\\">.*?data-price-final=\\\".*?\\\">.*?<\\\/div>.*?<\\\/a>\\r\\n/i);
    */


    let xhrBrr = [];
    xhrArr = xhr.results_html.split('data-ds-appid=\"');
    xhrArr.shift('bemly_');

    for (let ind = 0; ind < xhrArr.length; ind++) {
      let xhrAint = xhrArr[ind].split(/\" data-ds-itemkey[\s\S]*?title\">|<\/span[\s\S]*?class=\"col search_price  responsive_secondrow\">\r\n|<\/span[\s\S]*?class=\"col search_discount responsive_secondrow\">[\s\S]*?<span>|<\/span[\s\S]*?<strike>|<\/strike><\/span><br>|<\/div>[\s\S]*?$/i);
      xhrAint.pop('blueberryLanmei');
      for (let indd = 0; indd < xhrAint.length; indd++) {
        xhrAint[indd] = xhrAint[indd].trim('蓝莓小果冻');
      }
      xhrBrr.push(xhrAint);
      //xhrAint.length === 5 ? xhrAint[4].trim() : xhrAint[2].trim();
    
    /* 方案一 只适合有评论的
    for (let ind = 0; ind < xhrArr.length; ind++) {
      log(xhrArr[ind]);
        //把字符串分为AppID 名字 发行日期 评价 价格
        let xhrAint = xhrArr[ind].split(/\" data-ds-itemkey[\s\S]*?title\">|<\/span[\s\S]*?search_released responsive_secondrow\">|<\/div[\s\S]*?data-tooltip-html=\"|\">\r\n\t\t\t\t\t\t\t\t[\s\S]*?search_price  responsive_secondrow\">\r\n/i);
        
        //把没折扣的筛选出来
        if(xhrAint.length === 5) {
            //AppID 名字 发行日期 评价 价格
            xhrAint[4] = xhrAint[4].split(/<\/div>[\s\S]*?$/i)[0].trim('蓝莓小果冻');
        } else {
            //AppID 名字 发行日期 评价 打折力度 原价 现价
            let xa = xhrAint[3].split(/\">\r[\s\S]*?<span>|<\/span>[\s\S]*?<strike>|<\/strike><\/span><br>|<\/div>[\s\S]*?$/i);
            xhrAint[3] = xa[0];
            xhrAint.push(xa[1], xa[2], xa[3].trim('blueberryLanmei'));
        }
        //加入打折豪华大套餐
        xhrBrr.push(xhrAint);

        /* 6666 js 不支持?<!要逃避md
        \" data-ds-itemkey.*?title\\\">|(?<!\\t)<\\\/span>\\r\\n|
        */
    }
    log("正则格式化网页成功");
    return xhrBrr;
}

function priceHistoryCompare(o, a) {
  if (o.history === undefined) {
    if (a[4] === undefined) {
      o.history = [
        {
          date : whatime,
          price : a[2]
        }
      ]
    } else {
      o.history = [
        {
          date : whatime,
          price : a[4]
        }
      ]
    }
  }
  if (priceDic[~~a[0]] === undefined) return o;
  o.history = priceDic[~~a[0]].history;
  if (timeCompare(priceDic.date)) return o;
  if (o.isDiscount === 0) {
    //不买立省100% 不打折
    if (o.history[o.history.length-1].price === a[2]) return o;
    //等等党快乐屋 价格浮动
    o.history.push({
      date : whatime,
      price : a[2]
    });
    return o;
  } else {
    //G胖的阴谋 打折
    if (o.history[o.history.length-1].price === a[4]) return o;
    //等等党快乐屋 价格浮动
    o.history.push({
      date : whatime,
      price : a[4]
    });
    return o;
  }
}

function JSONformat(arr) {
    log("比较历史数据进行筛选");
    let obj = {};
    obj.date = whatime;
    for (let ind = 0; ind < arr.length; ind++) {
      if (arr[ind].length === 5) {
        obj[~~arr[ind][0]] = {
          name : encodeURI(arr[ind][1]),
          isDiscount : arr[ind][2],
          Oldprice : arr[ind][3],
          Newprice : arr[ind][4]
        }
      } else {
        obj[~~arr[ind][0]] = {
          name : encodeURI(arr[ind][1]),
          isDiscount : 0,
          price : arr[ind][2]
        }
      }
      obj[~~arr[ind][0]] = priceHistoryCompare(obj[~~arr[ind][0]], arr[ind]);
    }
    log("数组转换为JSON成功");
    return obj;
}


function quickSort( arr ) {
    //快速排序
    if(arr.length <= 1) return arr;
    const num = arr[0];
    let left = [], right = [];

    for(let i = 1;i < arr.length; i++) {
        if(arr[i]<=num) left.push(arr[i]);
        else right.push(arr[i]);
    }
    
    return quickSort(left).concat([num],quickSort(right));
}


//联网获取最新数据 url url$arg xmlhtmlres loopcount 递归前数组 计数传递
function getDataUrl(u, ua, ca, tc) {
    log("联网获取最新数据中");
    let res = http.get(u + 'count=' + ua.count + '&start=' + ua.start /*+ '&category1=' + ua.category*/ + '&infinite=1');
    //把网页进行格式化 国服API和外服共有 因此大部分APP是无效数据
    xhr = JSON.parse(res.body.string());
    if(tc !== 0) xhr.total_count = tc;
    if(xhr.total_count > 100) {
      xhr.total_count -= 100;
      ua.start += 100;
      ca = ca.concat(HTMLformat(xhr));
      return getDataUrl(u, ua, ca, xhr.total_count);
    } else {
      log("获取最新数据完毕");
      return ca.concat(HTMLformat(xhr));
    }
}

priceDic = readJSON();
writeJSON();

// function xlsCheck(xls) {
//     //本地数据与最新数据比较并保存
//     //先用jxl.jar,以后有空搞easyexcel

//     //md sheetjs不香吗 为了犀牛还是等等吧
    
//     let xls = new File("./蒸汽平台价格表.xls");
//     //importClass("jxl.Workbook") Workbook方法导入
//     let xlss = Workbook.getWorkbook(xls);
//     let sheet = xlss.getSheet("蒸汽平台价格表");

//     //读取数据
//     //sheet.getRows(),getColumns(),getCell(x,y)=>.getContents()
//     //Cell cell = sheet.getCell(0,0);
//     //System.out.println(cell.getContents());
//     //写入数据
//     //表.addCell(new Label(x, y, contents));

//     //追加代码太多以后优化再考虑 https://www.cnblogs.com/gocode/p/read_write-by-jxl.html

//     //以后再转表格* 先用JSON储存操作

//     //比较日期
//     getCell()
//     whatime

//     xlss.write();
//     xlss.close(); 

// }

// function XLSformat(arr, s) {
//     // [["更新日期",whatime.getTime],
//     // ["当前情况","价格波动"],
//     // ["APPID","名称","发行日期","评价","价格/折扣","原价","现价"]]
//     for (let x = 1; x < arr.length; x++) {
//         for (let y = 0; y < arr[x].length; y++) {
//              s.addCell(new Label(x, y, arr[x][y]));
//         }
        
//     }
    
//     //arr[0]
// }


// function readXls(params) {
//     let xls = new File("/sdcard/1/蒸汽平台价格表.xls");
//     let xlss =  Workbook.getWorkbook(xls);
//     let sheet = xlss.getSheet("蒸汽平台价格表");
//     log(sheet.getCell(x, y).getContents());
//     xlss.close(); //关闭表格

//     let xls = new File("/sdcard/1/sheet1.xls");
//     let xlss =  Workbook.createWorkbook(xls);
//     let s = xlss.createSheet("sheet1", 0);
//     let sb = 6;
//     //绘制当前情况
//     //标题(v,h)
//     s.addCell(new Label(0, 0, "更新日期"));
//     //sheet.addCell(new Label(1, 0, whatime.getTime));
//     s.addCell(new Label(0, 1, "当前情况"));
//     s.mergeCells(0, 1, 6, 1);
//     s.addCell(new Label(7, 1, "价格波动"));
//     s.mergeCells(7, 1, sb + 7, 1);
//     s.addCell(new Label(0, 2, "APPID"));
//     s.addCell(new Label(1, 2, "名称"));
//     s.addCell(new Label(2, 2, "发行日期"));
//     s.addCell(new Label(3, 2, "评价"));
//     s.addCell(new Label(4, 2, "价格/折扣"));
//     s.addCell(new Label(5, 2, "原价"));
//     s.addCell(new Label(6, 2, "现价"));
//     for (let i = 0; i < sb - 3; i++) {
//         s.addCell(new Label(7+i*4, 2, "日期"));
//         s.addCell(new Label(8+i*4, 2, "价格"));
//         s.addCell(new Label(9+i*4, 2, "备注"));
//         s.mergeCells(9+i*4, 2, 10+i*4, 2);
//         s.setColumnView(7+i*4,20);
//     }
    
//     //内容
//     s.setColumnView(0,12);
//     s.setColumnView(1,25);
//     s.setColumnView(2,20);
//     s.setColumnView(3,60);
//     s.setColumnView(4,12);
//     for (let h = 0; h < arr.length; h++) {
//         for (let v = 0; v < arr[h].length; v++) {
//             s.addCell(new Label(v, h+3, arr[h][v]));
//         }
        
//     }

//     let whatime = new Date();

//     //临时
//     for (let i = 0; i < sb - 3; i++) {
//         s.addCell(new Label(7+i*4, 3, whatime.getTime()));
//         s.addCell(new Label(8+i*4, 3, "¥ 48.00"));
//         s.addCell(new Label(9+i*4, 3, "打折"));
//         s.addCell(new Label(10+i*4, 3, "-60%"));
//     }

//     xlss.write();
//     xlss.close();
// }


// function writeXls(params) {
//     let xls = new File("/sdcard/1/蒸汽平台价格表.xls");
//     let xlss =  Workbook.createWorkbook(xls);
//     let sheet = xlss.createSheet("蒸汽平台价格表", 0);
//     XLSformat();
//     sheet.addCell(new Label(x, y, data));
//     xlss.write();
//     xlss.close();

//     let xls = new File("/sdcard/1/sheet1.xls");
//     let xlss =  Workbook.getWorkbook(xls);
//     let s = xlss.getSheet("sheet1");
//     let i = 0;
//     for (let iii = 3; s.getCell(0, iii).getContents() !== ""; iii++) {
//         while(s.getCell(7+i*4, iii).getContents() !== "") i++;
//         if(s.getCell(8+i*4, iii).getContents() !== arr[?]) writeXls分类汇总阶段('往后新追加');
//     }
//     writeXls分类完之后直接汇总();
    
//     xlss.close();
// }