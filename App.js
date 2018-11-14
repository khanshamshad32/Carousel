import React from 'react';
import {View} from 'react-native';

import CircularCarousel from './CircularCarousel';

export default class App extends React.Component {
  render() {

    const dataSource = [
        { url: "", color: "#FE0404" },
        { url: "", color: '#522A73' },
        { url: "", color: "#008200" },
        { url: "", color: "#034223" },
        { url: "", color: "#015280" },
      ];

    return (
      <View style={{ flex:1, justifyContent: 'center', alignItems:'center' }}>
      <CircularCarousel 
        dataSource={dataSource}
        onItemPress= {(item) => { 
                    console.log(item) ;
                    }
        }
        style={{ height: 200, width: 350}} 
        itemStyle={{ width: 110, height:120 }}
        radius={100}
      />
      </View>
    );
  }
}
