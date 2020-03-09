/* eslint-disable react-native/no-inline-styles */
//
// Circular Carousel
//
//  Created by Shamshad Khan on 20/09/18.
//  Copyright © 2018 Shamshad Khan. All rights reserved.
//

/* READ ME

Provide following properties as props to customise the carousel

  => 'dataSource' type, -> [ { { url, color} }, ... ]

    - 'url' is web url of image
    - 'color' is hex color code

  => 'onItemPress', method is called when the front item is clicked,
     the clicked item index returned as result.

  => 'containerDim' -> to set carosel height, width etc default is 200, 350 respectively

  => 'itemDim' -> to set item height, width etc default is 11, 100 respectively

  => 'radius' -> to set rotation radius of carousel, default is 100

*/

import React, { Component } from "react";
import {
	View,
	Image,
	TouchableNativeFeedback,
	TouchableWithoutFeedback,
	PanResponder,
	Platform
} from "react-native";

const ROTATION_DURATION = Platform.OS === "ios" ? 1 : 5;
const ELEVATION = Math.cos(Math.PI / 2.3);
const ROTATION_RATE = Platform.OS === "ios" ? 5 : 5;
const PAN_ROTATION_RATE = 0.08;

export default class CircularCarousel extends Component {
	constructor(props) {
		super(props);
		this.initState(props);
		this.addPenGesture();
	}

	initState(props) {
		let { dataSource } = props;
		let _angle = 360 / dataSource.length;

		let arr = dataSource.map((item, index) => {
			return {
				frame: { x: 0, y: 0, w: 0, h: 0 },
				angle: _angle * index,
				opacity: 1,
				zIndex: 100
			};
		});

		this.state = {
			items: arr,
			sortedItems: []
		};
	}

	static getDerivedStateFromProps(props, state) {
		let { itemDim, radius, dataSource } = props;
		let marginY = itemDim.height / 3;
		let n = dataSource.length;

		let middleItemAngle = (Math.floor(n / 2) * 360) / n;
		let alpha = middleItemAngle * (Math.PI / 180); // Radian conversion

		let min = radius * Math.cos(alpha) * ELEVATION + marginY;
		let max = radius * ELEVATION + marginY;
		return { ...state, marginY: { max, min } };
	}

	componentDidMount() {
		this.rearrangeItems(0, 0);
	}

	onItemPress(index) {
		let { sortedItems } = this.state;
		// sortedItems.map(item => console.log(item));
		if (index === sortedItems[0].index) {
			this.props.onItemPress(index);
			return;
		}
		this.rotateCarousel(index);
	}

	renderItem(data, index) {
		var item = this.state.items[index];

		const _itemStyle = {
			...Styles.itemStyle,
			marginTop: item.frame.y,
			marginLeft: item.frame.x,
			zIndex: item.zIndex,
			width: item.frame.w,
			height: item.frame.h,
			backgroundColor: data.color,
			opacity: item.opacity
		};

		let Feedback =
			Platform.OS === "ios"
				? TouchableWithoutFeedback
				: TouchableNativeFeedback;

		return (
			<Feedback
				onPress={() => this.onItemPress(index)}
				key={index}
				activeOpacity={1}>
				<View style={_itemStyle}>
					{/* <Image
            pointerEvents="none"
            style={{
              width: '100%',
              height: '100%',
            }}
            source={{uri: data.url}}
            resizeMode="contain"
          /> */}
				</View>
			</Feedback>
		);
	}

	render() {
		let { dataSource, style, containerDim } = this.props;
		let sortedItems = this.sortItems();
		let _style = {
			...Styles.containerStyle,
			...style,
			...containerDim
		};
		return (
			<View style={_style} {...this.panResponder.panHandlers}>
				{sortedItems.map((data) =>
					this.renderItem(dataSource[data.index], data.index)
				)}
			</View>
		);
	}

	//----------------------- L O G I C ---------------------------//

	addPenGesture() {
		this.panResponder = PanResponder.create({
			onMoveShouldSetResponderCapture: () => true,
			onMoveShouldSetPanResponder: (evt, gestureState) =>
				// Since we want to handle presses on individual items as well
				// Only start the pan responder when there is some movement
				this.state.items.length > 1 && Math.abs(gestureState.dx) > 10,

			onPanResponderMove: (evt, gestureState) => {
				let angle = (gestureState.moveX - gestureState.x0) * PAN_ROTATION_RATE;
				this.rearrangeItems(angle);
			},

			onPanResponderRelease: (e, { vx, vy }) => {
				this.rotateCarousel();
			}
		});
	}

	sortItems() {
		let { items } = this.state;

		let arr = items.map((item, index) => {
			return {
				index,
				depth: item.frame.y
			};
		});

		arr = arr.sort((a, b) => a.depth < b.depth);
		this.state.sortedItems = arr;
		return arr;
	}

	rearrangeItems(toAngle) {
		let { items } = this.state;
		let { itemDim, containerDim, radius } = this.props;
		let marginX = (containerDim.width - itemDim.width) / 2;
		let marginY = itemDim.height / 3;

		items.forEach((item) => {
			let _angle = (item.angle + toAngle + 360) % 360;
			let alpha = _angle * (Math.PI / 180); // Radian conversion
			let x = radius * Math.sin(alpha) + marginX;
			let y = radius * Math.cos(alpha) * ELEVATION + marginY;
			item.angle = _angle;
			item.frame = { ...item.frame, x, y };
			this.resetItemDimension(item);
		});

		this.forceUpdate();
	}

	rotateCarousel(index) {
		let activeItem = index !== undefined ? index : this.getFrontItem();
		let _angle = this.state.items[activeItem].angle;
		_angle = _angle > 180 ? 360 - _angle : -_angle;
		let sign = Math.sign(_angle);
		console.log(_angle, index);
		this.rotateItems(_angle, sign);
	}

	rotateItems(angleToRotate, sign) {
		if (Math.abs(angleToRotate) <= ROTATION_RATE) {
			this.rearrangeItems(angleToRotate);
			return;
		}
		this.rearrangeItems(ROTATION_RATE * sign);
		setTimeout(() => {
			this.rotateItems((Math.abs(angleToRotate) - ROTATION_RATE) * sign, sign);
		}, ROTATION_DURATION);
	}

	getFrontItem() {
		let { items } = this.state;
		let max = items[0].frame.y;
		let frontIndex = 0;

		items.forEach(({ frame }, index) => {
			if (max < frame.y) {
				max = frame.y;
				frontIndex = index;
			}
		});
		return frontIndex;
	}

	resetItemDimension(item) {
		let { width, height } = this.props.itemDim;
		let { frame } = item;

		let c = this.scalingCoefficient(item);
		let w = width * c;
		let h = height * c;
		let x = frame.x + (width - w) / 2;

		item.frame = { ...frame, w, h, x };
		item.opacity = 0.5;
		item.zIndex = 100 * c;
	}

	scalingCoefficient(item) {
		let { y } = item.frame;
		let { max, min } = this.state.marginY;
		let d = (max - min || Number.MAX_VALUE) * 5;
		return (y - min) / d + 0.8;
	}
}

CircularCarousel.defaultProps = {
	containerDim: { height: 200, width: 350 },
	itemDim: { height: 110, width: 100 }
};

const Styles = {
	containerStyle: {
		backgroundColor: "transparent",
		width: 300,
		height: 200,
		overflow: "hidden"
	},
	itemStyle: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		padding: 10,
		borderRadius: 15
	}
};
