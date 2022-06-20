import  React,{Component} from 'react';
import BMap from 'BMap';
import './App.css'
import {BMAP_HYBRID_MAP, BMAP_NORMAL_MAP} from "./type";

 class Map extends Component{ 
    render() {
        return(
                <div className="address" id="address">
                </div>
        )
    }
    componentDidMount() {
        var map = new BMap.Map("address"); // 创建Map实例
        console.log(map)
        map.centerAndZoom(new BMap.Point(116.404, 39.915), 11); // 初始化地图,设置中心点坐标和地图级别
        map.addControl(new BMap.MapTypeControl({
            mapTypes:[
                BMAP_HYBRID_MAP,//混合地图
                BMAP_NORMAL_MAP//地图
            ]})); //添加地图类型控件
        map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
        map.enableScrollWheelZoom();
    }
}
export default Map