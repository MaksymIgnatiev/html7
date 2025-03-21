export type State<T> = {
	/** Get the current state value */
	get<K extends keyof T>(key: K): T[K]
	/** Set the current state value, and return it */
	set<K extends keyof T>(key: K, value: T[K]): T[K]
	/** Subscribe to an event with function, and return a set of already subscribed events */
	subscribe<K extends keyof T>(key: K, fn: () => void): Set<() => void>
}

export function createState<T extends Record<string, any>>(
	initialState: T,
): State<T> {
	var listeners = new Map<keyof T, Set<() => void>>(),
		notify = (key: keyof T) => {
			listeners.get(key)?.forEach((fn) => fn())
		}

	return {
		get(key) {
			return initialState[key]
		},
		set(key, value) {
			initialState[key] = value
			notify(key)
			return value
		},
		subscribe(key, fn) {
			if (!listeners.has(key)) listeners.set(key, new Set())
			listeners.get(key)!.add(fn)
			return listeners.get(key)!
		},
	}
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	props: Partial<HTMLElementTagNameMap[K]> | null = {},
	children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
	var el = document.createElement(tag)

	Object.entries(props ?? {}).forEach(([key, value]) => {
		if (key.startsWith("on") && typeof value === "function") {
			el.addEventListener(
				key.substring(2).toLowerCase(),
				value as EventListener,
			)
		} else {
			Object.defineProperty(el, key, { value })
		}
	})

	children.forEach((child) => {
		if (typeof child === "string") {
			el.appendChild(document.createTextNode(child))
		} else {
			el.appendChild(child)
		}
	})

	return el
}

export function renderComponent(
	component: () => HTMLElement,
	container: HTMLElement,
) {
	container.innerHTML = ""
	container.appendChild(component())
}

export default {
	createState,
	createElement,
	renderComponent,
}
