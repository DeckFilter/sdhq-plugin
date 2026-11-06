import {
	Focusable,
	FocusableProps,
	GamepadButton,
	GamepadEvent,
} from "@decky/ui"
import React, { CSSProperties, FC, Ref, forwardRef, useRef } from "react"

const DEFAULTSCROLLSPEED = 50

export interface ScrollableElement extends HTMLDivElement {}

export function scrollableRef() {
	return useRef<ScrollableElement | null>(null)
}

export const Scrollable = forwardRef<ScrollableElement, React.HTMLAttributes<ScrollableElement>>(
	(props, ref) => {
		const style: CSSProperties = {
			...props.style,
			height: "95vh",
			overflowY: "scroll",
		}

		return (
			<React.Fragment>
				<div {...props} ref={ref as Ref<HTMLDivElement>} style={style} />
			</React.Fragment>
		)
	}
)

interface ScrollAreaProps extends FocusableProps {
	scrollable: React.RefObject<ScrollableElement | null>
	scrollSpeed?: number
}

// const writeLog = async (serverApi: ServerAPI, content: any) => {
// 	let text = `${content}`
// 	serverApi.callPluginMethod<{ content: string }>("log", { content: text })
// }

const scrollOnDirection = (
	e: GamepadEvent,
	ref: React.RefObject<ScrollableElement | null>,
	amt: number,
	prev: React.RefObject<HTMLDivElement | null>,
	next: React.RefObject<HTMLDivElement | null>
) => {
	let childNodes = ref.current?.childNodes
	let currentIndex = null
	childNodes?.forEach((node, i) => {
		if (node == e.currentTarget) {
			currentIndex = i
		}
	})

	const currentTarget = e.currentTarget as HTMLElement | null
	const pos = currentTarget?.getBoundingClientRect()
	const out = ref.current?.getBoundingClientRect()

	if (e.detail.button == GamepadButton.DIR_DOWN) {
		if (
			pos != undefined &&
			out?.bottom != undefined &&
			pos.bottom <= out.bottom &&
			currentIndex != null &&
			childNodes != undefined &&
			currentIndex + 1 < childNodes.length
		) {
			next.current?.focus()
		} else {
			ref.current?.scrollBy({ top: amt, behavior: "smooth" })
		}
	} else if (e.detail.button == GamepadButton.DIR_UP) {
		if (
			pos != undefined &&
			out?.top != undefined &&
			pos.top >= out.top &&
			currentIndex != null &&
			childNodes != undefined &&
			currentIndex - 1 >= 0
		) {
			prev.current?.focus()
		} else {
			ref.current?.scrollBy({ top: -amt, behavior: "smooth" })
		}
	}
}

export const ScrollArea: FC<ScrollAreaProps> = (props) => {
	let scrollSpeed = DEFAULTSCROLLSPEED
	if (props.scrollSpeed) {
		scrollSpeed = props.scrollSpeed
	}

	const prevFocus = useRef<HTMLDivElement>(null)
	const nextFocus = useRef<HTMLDivElement>(null)

	props.onActivate = (e) => {
		const ele = e.currentTarget as HTMLElement
		ele.focus()
	}
	props.onGamepadDirection = (e) => {
		scrollOnDirection(
			e,
			props.scrollable,
			scrollSpeed,
			prevFocus,
			nextFocus
		)
	}

	return (
		<React.Fragment>
			<Focusable ref={prevFocus} children={[]} onActivate={() => {}} />
			<Focusable {...props} />
			<Focusable ref={nextFocus} children={[]} onActivate={() => {}} />
		</React.Fragment>
	)
}
