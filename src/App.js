/* eslint-disable no-loop-func */
import { FolderOutlined } from '@ant-design/icons';
import { Button, Input, Layout, Radio, Switch } from 'antd';
import './App.css';
import {BMAP_HYBRID_MAP, BMAP_NORMAL_MAP} from "./type";
import React, { useEffect, useRef, useState } from 'react';
import Papa from "papaparse";
import jschardet from "jschardet";
import heatmap from "./heatmap.png";
const { Header, Content } = Layout;

let heatmapOverlay = '';
let map = '';
let dta = [];
let BMap = window.BMap;
let BMapLib = window.BMapLib;

const App = () => {
  const inputRef = useRef(null);
  const [radius, setRadius] = useState(25);
  const [max, setMax] = useState(-50);
  const [min, setMin] = useState(-150);
  const [cnt2, setCnt2] = useState(-70);
  const [cnt3, setCnt3] = useState(-90);
  const [cnt4, setCnt4] = useState(-110);
  const [cnt5, setCnt5] = useState(-130);
  const [needConvert, setNeedConvert] = useState(false);

  const readCSV = () => {
    inputRef.current.click();
  }

  const checkEncoding = (base64Str) => {
    const str = atob(base64Str.split(";base64,")[1]); // atob  方法 Window 对象 定义和用法 atob() 方法用于解码使用 base-64 编码的字符
    //要用二进制格式
    let encoding = jschardet.detect(str);
    encoding = encoding.encoding;
    // 有时候会识别错误
    if(encoding === "windows-1252"){
      encoding = "ANSI";
    }
    return encoding;
  }

  const dbm2per = (dbm) => {
    const m1 = +max;
    const m2 = +min;
    const d = m1 - m2;
    return (+dbm - m2) * 100 / d;
  }

  const handleCSV = (e) => {
    const file = e.target.files[0];
      const fReader = new FileReader();
      fReader.readAsDataURL(file); //  readAsDataURL 读取本地文件 得到的是一个base64值
      fReader.onload = function(evt) {// 读取文件成功
        const data = evt.target.result;
        const encoding = checkEncoding(data);
        //papaparse.js 用来解析转换成二维数组
        Papa.parse(file, {
          encoding: encoding,
          complete: function(results) {        // UTF8 \r\n与\n混用时有可能会出问题
            const res = results.data;
            if(res[res.length - 1] === ""){    //去除最后的空行 有些解析数据尾部会多出空格
              res.pop();
            }
            const m = {};
            // 当前res 就是二维数组的值 数据拿到了 那么在前端如何处理渲染 就根据需求再做进一步操作了
            for (let i = 1;i < res.length - 1;i++) {
              if (m[res[i][0]] === res[i][1]) {
                continue 
              } else {
                dta.push({
                  lng: +res[i][1],
                  lat: +res[i][0],
                  count: +dbm2per(res[i][2]),
                  dbm: +res[i][2],
                });
                m[res[i][0]] = res[i][1];
              }
            }
            console.log(res, dta, m);
            map.addOverlay(heatmapOverlay);
            heatmapOverlay.setDataSet({data:dta,max:100});
            heatmapOverlay.show();
          }
        });
      }
      return false;
  };

    const changeRadius = (e) => {
      setRadius(+e.target.value);
    } 

    const showNewHeatMapOverlay = () => {
      map.clearOverlays();
      heatmapOverlay = new BMapLib.HeatmapOverlay({"radius": radius});
      map.addOverlay(heatmapOverlay);
      for (let i = 0;i < dta.length;i++) {
        dta[i].count = dbm2per(dta[i].dbm);
      };
      if (needConvert) {
        // eslint-disable-next-line no-unused-vars
        let convertor = new BMap.Convertor();
        const points = [];
        for (let i = 0;i < dta.length;i++) {
          points.push(new BMap.Point(dta[i].lng, dta[i].lat));
        }
        convertor.translate(points, 1, 5, (data) => {
          console.log(data)
          if (data.status === 0) {
            for (let i = 0;i < data.points.length;i++) {
              dta[i] = {
                lng: data.points[i].lng,
                lat: data.points[i].lat,
                count: dta[i].count,
                dbm: dta[i].dbm,
              }
            }
            console.log(dta)
            heatmapOverlay.setDataSet({data:dta,max:100});
            heatmapOverlay.show();
          }
        })
      } else {
        heatmapOverlay.setDataSet({data:dta,max:100});
        heatmapOverlay.show();
      }
    }

  useEffect(() => {
    map = new BMap.Map("address"); // 创建Map实例
    map.centerAndZoom(new BMap.Point(114.426474, 30.505245), 11); // 初始化地图,设置中心点坐标和地图级别
    map.addControl(new BMap.MapTypeControl({
        mapTypes:[
            BMAP_HYBRID_MAP,//混合地图
            BMAP_NORMAL_MAP//地图
        ]})); //添加地图类型控件
    map.setCurrentCity("武汉"); // 设置地图显示的城市 此项是必须设置的
    map.enableScrollWheelZoom();
    heatmapOverlay = new BMapLib.HeatmapOverlay({"radius": radius});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeMax = (value) => {
    setMax(value);

    const d = (value - min) / 5;
    setCnt2(value - d);
    setCnt3(value - d * 2);
    setCnt4(value - d * 3);
    setCnt5(value - d * 4);
  }

  const changeMin = (value) => {
    setMin(value);

    const d = (max - value) / 5;
    setCnt2(max - d)
    setCnt3(max - d * 2)
    setCnt4(max - d * 3)
    setCnt5(max - d * 4)
  }

  return (
  <Layout className="container">
    <Header className="header">
      <div className="logo" />
      <input type="file" ref={inputRef} accept=".csv" onChange={(e) => handleCSV(e)} hidden />
      <FolderOutlined className="trigger" onClick={() => readCSV()} />
      <Input className="input" value={radius} onChange={(e) => changeRadius(e)} />
      <Input className="input" value={max} onChange={(e) => changeMax(e.target.value)} />
      <Input className="input" value={min} onChange={(e) => changeMin(e.target.value)} />
      <span className="prefix">{'启用坐标转换'}</span>
      <Switch className="radio" onChange={(e) => setNeedConvert(e)} />
      <Button type="default" size='small' className='button' onClick={() => showNewHeatMapOverlay()}>应用</Button>
    </Header>
    <Content
      style={{
        padding: '0 50px',
        flex: '1',
      }}
    >
      <Layout
        className="site-layout-background"
        style={{
          padding: '18px 0',
          margin: '24px 0'
        }}
      >
        <Content
          style={{
            padding: '0 24px',
          }}
          className="site-layout-background"
        >
          <div className="address" id="address" />
          <div className="left-nav">
            <div className='cnt1'>{max}</div>
            <div className='cnt2'>{cnt2}</div>
            <div className='cnt2'>{cnt3}</div>
            <div className='cnt2'>{cnt4}</div>
            <div className='cnt2'>{cnt5}</div>
            <div className='cnt2'>{min}</div>
          </div>
          <img className="img" src={heatmap} alt="图例" />
        </Content>
      </Layout>
    </Content>
  </Layout>
)};

export default App;
