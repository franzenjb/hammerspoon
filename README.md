# Hammerspoon Workspace Automator

## Overview
This project defines a **Hammerspoon automation environment** tailored for a **4-monitor MacBook Pro M4 Max setup**.  
It resets and arranges all applications across monitors with one hotkey, providing a consistent working environment for productivity, GIS, and creative workflows.

Hammerspoon is a macOS automation tool that exposes system events and applications via Lua scripting. It lets you control windows, apps, keyboard shortcuts, and more.

This project **removes all previous configuration** and starts clean, with a single powerful binding:

### ⌘ + ⌥ + ⌃ + W  
Resets and rebuilds the entire workspace.

---

## Multi-Monitor Layout

The system uses **four screens**:

1. **Monitor 1 (left vertical):** Samsung LU28R55  
2. **Monitor 2 (next vertical):** Samsung LU28R55  
3. **Monitor 3 (center ultrawide):** LG UltraWide  
4. **Monitor 4 (MacBook built-in Retina Display)**

---

## Behavior of ⌘⌥⌃W

When the hotkey is pressed:

1. **Menu-bar apps relaunched** (never closed):  
   - Raycast  
   - Wispr Flow  
   - Hand Mirror  

2. **All other apps are closed** (workspace reset).  

3. **Applications launched:**  
   - Microsoft Outlook  
   - Microsoft Teams  
   - Notion  
   - Two Terminal windows  
   - Chrome (with `Default` profile, **exactly 3 tabs only**):  
     - Tab 1: ChatGPT  
     - Tab 2: WKHR Radio  
     - Tab 3: ArcGIS CCAR Weather Dashboard  

4. **Window layout enforced:**  
   - **Monitor 1 (left vertical):**  
     - Outlook (top half)  
     - Teams (bottom half)  
   - **Monitor 2 (vertical):**  
     - Terminal (top half)  
     - Hammerspoon Console or second Terminal (bottom half)  
   - **Monitor 3 (ultrawide):**  
     - Single Chrome window fullscreen with the 3 tabs above  
   - **Monitor 4 (MacBook):**  
     - Notion fullscreen  

---

## Installation

1. Install [Hammerspoon](https://www.hammerspoon.org/).  
2. Replace any existing `~/.hammerspoon/init.lua` with the script below.  
3. Reload Hammerspoon (`Cmd+Ctrl+Shift+R`) or restart the app.  
4. Press **⌘⌥⌃W** to reset and arrange the workspace.

---

## Full `init.lua` Script

```lua
-- Hammerspoon Workspace Reset Script
-- Trigger with: cmd+alt+ctrl+W

hs.hotkey.bind({"cmd","alt","ctrl"}, "W", function()
  --------------------------------------------------------------------
  -- STEP 1: Relaunch menu-bar apps (never closed)
  --------------------------------------------------------------------
  hs.application.launchOrFocus("Raycast")
  hs.application.launchOrFocus("Wispr Flow")
  hs.application.launchOrFocus("Hand Mirror")

  -- Close everything else (except essentials)
  local toKeep = {
    ["Hammerspoon"]=true,
    ["Finder"]=true,
    ["Raycast"]=true,
    ["Wispr Flow"]=true,
    ["Hand Mirror"]=true
  }
  for _, app in ipairs(hs.application.runningApplications()) do
    local name = app:name()
    if name and not toKeep[name] then app:kill() end
  end

  --------------------------------------------------------------------
  -- STEP 2: Launch core apps
  --------------------------------------------------------------------
  hs.timer.doAfter(3, function()
    local screens = {
      one   = hs.screen.find(5), -- left vertical
      two   = hs.screen.find(2), -- next vertical
      three = hs.screen.find(3), -- ultrawide
      four  = hs.screen.find(1)  -- MacBook
    }

    -- Productivity apps
    hs.application.launchOrFocus("Microsoft Outlook")
    hs.application.launchOrFocus("Microsoft Teams")
    hs.application.launchOrFocus("Notion")

    -- Terminals
    hs.task.new("/usr/bin/open", nil, { "-na", "Terminal" }):start()
    hs.task.new("/usr/bin/open", nil, { "-na", "Terminal" }):start()

    ----------------------------------------------------------------
    -- STEP 3: Chrome (Default profile, 3 tabs only)
    ----------------------------------------------------------------
    hs.osascript.applescript('tell application "Google Chrome" to quit')

    hs.timer.doAfter(2, function()
      hs.task.new("/usr/bin/open", nil, {
        "-na", "Google Chrome", "--args",
        "--profile-directory=Default", -- confirmed profile
        "https://chat.openai.com/",
        "https://streamdb7web.securenetsystems.net/v5/WKHR",
        "https://experience.arcgis.com/experience/1057b83e298b42bf88c9d1f82619d026?draft=true"
      }):start()
    end)

    ----------------------------------------------------------------
    -- STEP 4: Window arrangement
    ----------------------------------------------------------------
    hs.timer.doAfter(8, function()
      local wins = hs.window.filter.default:getWindows()
      local outlook, teams, t1, t2, notion, console, chromeMain

      for _,w in ipairs(wins) do
        local app = w:application():name()
        if app=="Microsoft Outlook" then outlook=w
        elseif app=="Microsoft Teams" then teams=w
        elseif app=="Terminal" and not t1 then t1=w
        elseif app=="Terminal" then t2=w
        elseif app=="Notion" then notion=w
        elseif app=="Hammerspoon" then console=w
        elseif app=="Google Chrome" then chromeMain=w
        end
      end

      local function place(win, screen, xFrac, wFrac, yFrac, hFrac)
        if win and screen then
          local f = screen:frame()
          win:moveToScreen(screen)
          win:setFrame({
            x=f.x+f.w*xFrac,
            y=f.y+f.h*yFrac,
            w=f.w*wFrac,
            h=f.h*hFrac
          })
        end
      end

      local function halfRows(screen, topWin, bottomWin)
        if screen then
          local f = screen:frame()
          if topWin then topWin:moveToScreen(screen):setFrame({x=f.x,y=f.y,w=f.w,h=f.h/2}) end
          if bottomWin then bottomWin:moveToScreen(screen):setFrame({x=f.x,y=f.y+f.h/2,w=f.w,h=f.h/2}) end
        end
      end

      local function full(screen, win)
        if screen and win then
          win:moveToScreen(screen)
          win:setFrame(screen:frame())
        end
      end

      -- Layout rules
      halfRows(screens.one, outlook, teams)            -- Monitor 1: Outlook / Teams
      halfRows(screens.two, t1, console or t2)         -- Monitor 2: Terminals / Console
      if chromeMain then full(screens.three, chromeMain) end -- Ultrawide = Chrome fullscreen (3 tabs)
      full(screens.four, notion)                       -- MacBook = Notion fullscreen
    end)
  end)
end)
```

---

## 10 Extension Ideas

1. **Focus Mode:** One fullscreen app per monitor, toggleable hotkey.  
2. **Art Mode:** Open Procreate, music streaming tab, and reference images in predefined slots.  
3. **GIS Mode:** Auto-launch ArcGIS Pro, Experience Builder, and dashboards in fixed layouts.  
4. **Meetings Mode:** Launch Zoom/Teams, Notion notes, Outlook calendar, arranged side by side.  
5. **Dynamic Tiling:** Automatically adjust ultrawide into 2–6 tiles depending on how many windows are open.  
6. **Auto-Recovery:** Detect and close stray Chrome profile chooser windows.  
7. **Time-Based Layouts:** Automatically reset the workspace at 9am (work mode), 7pm (art mode).  
8. **Voice Commands:** Integrate with Raycast or macOS Dictation to trigger layouts by voice.  
9. **Workspace Presets:** Map different layouts to different hotkeys (⌘⌥⌃1 = Work, ⌘⌥⌃2 = Creative, etc.).  
10. **Auto-Save + Restore:** Save current window arrangement and restore it later with a hotkey.  
