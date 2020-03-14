//
// Circular Carousel
//
//  Created by Shamshad Khan on 14/03/2020.
//  Copyright © 2020 Shamshad Khan. All rights reserved.
//

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
const PAN_ROTATION_RATE = 0.05;

export default class CircularCarousel extends Component {
	constructor(props) {
		super(props);
		this.state = { items: [], containerDim: {}, itemDim: {}, radius: 0 };
		this.addPenGesture();
	}

	static getDerivedStateFromProps(props, state) {
		let { dataSource, itemDim, containerDim, radius } = props;

		if (
			dataSource.length !== state.items.length ||
			state.containerDim !== containerDim ||
			state.itemDim !== itemDim ||
			state.radius !== radius
		) {
			let { items } = state;

			if (dataSource.length !== state.items.length) {
				let _angle = 360 / dataSource.length;
				items = dataSource.map((item, index) => {
					return { angle: _angle * index };
				});
			}

			let marginY = itemDim.height / 3;
			let n = dataSource.length;
			let middleItemAngle = (Math.floor(n / 2) * 360) / n;
			let alpha = middleItemAngle * (Math.PI / 180); // Radian conversion
			let min = radius * Math.cos(alpha) * ELEVATION + marginY;
			let max = radius * ELEVATION + marginY;

			let _state = {
				marginY: { max, min },
				items,
				sortedItems: [],
				containerDim,
				itemDim,
				radius
			};

			CircularCarousel.rearrangeItems(0, _state, props);
			return _state;
		}
		return null;
	}

	onItemPress(index) {
		let { sortedItems } = this.state;
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
					<Image
						pointerEvents="none"
						style={{
							width: "100%",
							height: "100%"
						}}
						source={{ uri: data.url }}
						resizeMode="contain"
					/>
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
				let { state, props } = this;
				let items = CircularCarousel.rearrangeItems(angle, state, props);
				this.setState({ items });
			},

			onPanResponderRelease: (e, { vx, vy }) => {
				this.rotateCarousel();
			}
		});
	}

	sortItems() {
		let { items } = this.state;
		let arr = items.map((item, index) => {
			return { index, depth: item.frame.y };
		});

		arr = arr.sort((a, b) => a.depth < b.depth);
		this.state.sortedItems = arr;
		return arr;
	}

	rotateCarousel(index) {
		let activeItem = index !== undefined ? index : this.getFrontItem();
		let _angle = this.state.items[activeItem].angle;
		_angle = _angle > 180 ? 360 - _angle : -_angle;
		let sign = Math.sign(_angle);
		this.rotateItems(_angle, sign);
	}

	rotateItems(angleToRotate, sign) {
		let { state, props } = this;
		let items;
		if (Math.abs(angleToRotate) <= ROTATION_RATE) {
			items = CircularCarousel.rearrangeItems(angleToRotate, state, props);
		} else {
			items = CircularCarousel.rearrangeItems(
				ROTATION_RATE * sign,
				state,
				props
			);
			setTimeout(() => {
				this.rotateItems(
					(Math.abs(angleToRotate) - ROTATION_RATE) * sign,
					sign
				);
			}, ROTATION_DURATION);
		}
		this.setState({ items });
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

	static scalingCoefficient(item, state) {
		let { y } = item.frame;
		let { max, min } = state.marginY;
		let d = (max - min || Number.MAX_VALUE) * 5;
		return (y - min) / d + 0.8;
	}

	static resetItemDimension(item, state, props) {
		let { width, height } = props.itemDim;
		let { frame } = item;

		let c = CircularCarousel.scalingCoefficient(item, state);
		let w = width * c;
		let h = height * c;
		let x = frame.x + (width - w) / 2;

		item.frame = { ...frame, w, h, x };
		item.opacity = 0.5;
		item.zIndex = 100 * c;
	}

	static rearrangeItems(toAngle, state, props) {
		let { items } = state;
		let { itemDim, containerDim, radius } = props;
		let marginX = (containerDim.width - itemDim.width) / 2;
		let marginY = itemDim.height / 3;

		items.forEach((item) => {
			let _angle = (item.angle + toAngle + 360) % 360;
			let alpha = _angle * (Math.PI / 180); // Radian conversion
			let x = radius * Math.sin(alpha) + marginX;
			let y = radius * Math.cos(alpha) * ELEVATION + marginY;

			item.angle = _angle;
			item.frame = { ...item.frame, x, y };
			CircularCarousel.resetItemDimension(item, state, props);
		});
		return items;
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
