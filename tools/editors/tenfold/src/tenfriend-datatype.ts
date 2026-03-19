export interface TenfriendDoc {
	name: string
	"@patchwork": {type: string}
}

export const TenfriendDatatype = {
	init(doc: TenfriendDoc) {
		doc.name = ""
	},

	getTitle(doc: TenfriendDoc) {
		return doc.name || "New Tenfriend"
	},

	setTitle(doc: TenfriendDoc, title: string) {
		doc.name = title
	},
}
