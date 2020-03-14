# @khanshamshad32/carousel

A react native library for android and iOS.


## Install

`$ npm install @khanshamshad32/carousel`


## Usage

    import Carousel from '@khanshamshad32/carousel';

    const dataSource = [
      {url: '', color: '#FE0404'},
      {url: '', color: '#522A73'},
      {url: '', color: '#008200'},
      {url: '', color: '#034223'},
      {url: '', color: '#015280'},
    ];

    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <Carousel
           dataSource={dataSource}
           onItemPress={item => {
             console.log(item);
           }}
           containerDim={{height: 200, width: 350}}
           itemDim={{width: 100, height: 110}}
           radius={100}
           />
        </View>
    );




# Demo

![](Carousel.gif)
