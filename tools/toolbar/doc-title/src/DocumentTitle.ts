import "./styles.css"
import type {DocHandle} from "@automerge/automerge-repo"
import {
	getType,
	type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem"
import {
	getRegistry,
	type ToolElement,
	type DatatypeDescription,
	type DatatypeImplementation,
} from "@inkandswitch/patchwork-plugins"

export function renderDocumentTitle(
	handle: DocHandle<HasPatchworkMetadata>,
	element: ToolElement
) {
	element.style.flex = "1"
	element.style.minWidth = "0"

	const span = document.createElement("span")
	span.className = "doc-title"
	span.textContent = "Untitled"
	element.appendChild(span)

	const input = document.createElement("input")
	input.className = "doc-title-input"
	input.type = "text"
	element.appendChild(input)

	let editing = false
	let currentSetTitle:
		| DatatypeImplementation["setTitle"]
		| undefined

	function getTitle() {
		const doc = handle.doc()
		if (!doc) return "Untitled"
		const datatypeId = getType(doc)
		if (!datatypeId) return "Untitled"
		const registry = getRegistry<DatatypeDescription>("patchwork:datatype")
		const loaded = registry.get(datatypeId)
		if (!loaded || !("module" in loaded)) return "Untitled"
		const impl = loaded.module as DatatypeImplementation
		currentSetTitle = impl.setTitle
		return impl.getTitle(doc) || "Untitled"
	}

	function update() {
		if (editing) return
		const title = getTitle()
		span.textContent = title
		span.title = title
	}

	function enterEditMode() {
		if (!currentSetTitle) return
		editing = true
		span.style.display = "none"
		input.style.display = "block"
		input.value = span.textContent || ""
		input.focus()
		input.select()
	}

	function exitEditMode(save: boolean) {
		if (!editing) return
		editing = false
		span.style.display = ""
		input.style.display = "none"

		if (save && currentSetTitle) {
			const newTitle = input.value.trim()
			if (newTitle && newTitle !== span.textContent) {
				const setTitle = currentSetTitle
				handle.change(doc => {
					setTitle(doc, newTitle)
				})
			}
		}
	}

	span.addEventListener("click", enterEditMode)

	input.addEventListener("blur", () => exitEditMode(true))
	input.addEventListener("keydown", e => {
		if (e.key === "Enter") {
			e.preventDefault()
			exitEditMode(true)
		} else if (e.key === "Escape") {
			exitEditMode(false)
		}
	})

	handle.on("change", update)
	update()

	// also try to load the datatype async if it wasn't ready yet
	const doc = handle.doc()
	if (doc) {
		const datatypeId = getType(doc)
		if (datatypeId) {
			const registry = getRegistry<DatatypeDescription>("patchwork:datatype")
			registry.load(datatypeId).then(() => update())
		}
	}

	return () => {
		handle.off("change", update)
	}
}
