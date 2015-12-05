
// Copyright (c) Shou 2015
// License: MIT

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const Main = imports.ui.main;

function init(em) {
    return new Preview(em)
}

function Preview(em) {
    this.init(em)
}

Preview.prototype = {
    preview: null,
    workspaceSwitchSignal: null,
    overviewShowingSignal: null,
    overviewHidingSignal: null,
    posX: 0,
    posY: 0,
    corner: 0,
    overview: false,

    init: function(em) {
        this.extensionMeta = em
        this.switchCorner(0)
    },

    enable: function() {
        this.workspaceSwitchSignal =
            global.screen.connect( "workspace-switched"
                                 , Lang.bind(this, this.mpvFloat)
                                 )
        this.overviewHidingSignal =
            Main.overview.connect( "hiding"
                                 , Lang.bind(this, this.toggleView, false)
                                 )
        this.overviewShowingSignal =
            Main.overview.connect( "showing"
                                 , Lang.bind(this, this.toggleView, true)
                                 )
    },

    disable: function() {
        this.removePreview()
        global.screen.disconnect(this.workspaceSwitchSignal)
        Main.overview.disconnect(this.overviewHidingSignal)
        Main.overview.disconnect(this.overviewShowingSignal)
    },

    toggleView: function(_, active) {
        this.overview = active
        if (active) {
            this.removePreview()

        } else {
            this.mpvFloat()
        }
    },

    mpvFloat: function() {
        let mpv = this.getMPVWindow()
        if (mpv !== null && ! this.overview) {
            this.showPreview(mpv)

        } else {
            this.removePreview()
        }
    },

    getMPVWindow: function() {
        let mpv = null
        let len = global.screen.n_workspaces

        for (let i = 0; i < len; i++) {
            if (global.screen.get_active_workspace_index() === i) continue

            let ws = global.screen.get_workspace_by_index(i)
            let wins = ws.list_windows()

            for (let j = 0, l = wins.length; j < l; j++) {
                if (wins[j].get_wm_class() === "mpv") {
                    mpv = wins[j]
                }
            }
        }

        return mpv
    },

    switchCorner: function(n) {
        let g = Main.layoutManager.getWorkAreaForMonitor(0)

        this.corner = (this.corner + 1) % 4
        switch(this.corner) {
            case 0:
                this.posX = g.x + 10
                this.posY = g.y + 10
                break

            case 1:
                this.posX = g.x + g.width - this.preview.get_width() - 10
                this.posY = g.y + 10
                break

            case 2:
                this.posX = g.x + g.width - this.preview.get_width() - 10
                this.posY = g.y + g.height - this.preview.get_height() - 10
                break

            case 3:
                this.posX = g.x + 10
                this.posY = g.y + g.height - this.preview.get_height() - 10
        }

        this.preview.set_position(this.posX, this.posY)
    },

    showPreview: function(win) {
        this.removePreview()

        this.preview = new St.Button({ style_class: "mpv-preview" })
        let th = this.getThumbnail(win, 640)

        this.preview.connect( "enter-event"
                            , Lang.bind(this, this.switchCorner)
                            )

        this.preview.add_actor(th)
        this.preview.set_position(this.posX, this.posY)

        Main.layoutManager.addChrome(this.preview)
    },

    removePreview: function() {
        if (this.preview !== null) {
            this.preview.destroy()
            this.preview = null
        }
    },

    getThumbnail: function(win, size) {
        let th = null
        let mutw = win.get_compositor_private()

        if (mutw) {
            let wtext = mutw.get_texture()
            let [width, height] = wtext.get_size()
            let scale = Math.min(1.0, size / width, size / height)
            th = new Clutter.Clone({ source: wtext
                                   , reactive: true
                                   , width: width * scale
                                   , height: height * scale
                                   })
        }

        return th
    }
}
