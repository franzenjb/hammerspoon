// Available applications - Jeff's actual workflow apps
const apps = [
    'Microsoft Outlook', 'Microsoft Teams', 'Notion', 'Red Sands', 'ChatGPT',
    'Claude', 'Perplexity- Ask Anything', 'Cursor', 'GitHub Desktop', 'Messages',
    'Microsoft Excel', 'Microsoft Word', 'Microsoft PowerPoint', 'Hammerspoon',
    'Google Chrome', 'Microsoft Edge', 'Safari', 'Perplexity Comet'
];

// Current hotkey configuration
let currentHotkey = { keys: ['cmd', 'alt', 'ctrl'], trigger: 'W', display: '⌘ + ⌥ + ⌃ + W' };

// Preset management
let workspacePresets = {};
let currentPresetId = 'default';
let currentPresetName = 'Default Workspace';

// Workspace configuration
let workspaceConfig = {
    monitor1: { split: 'split-2', apps: { top: null, bottom: null } },
    monitor2: { split: 'split-2', apps: { top: null, bottom: null } },
    monitor3: { split: 'single', apps: { full: null } },
    monitor4: { split: 'single', apps: { full: null } }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing workspace designer...');
    initializeDragAndDrop();
    initializeSplitSelectors();
    populateDropdowns();
    loadPresets();
    updatePresetDisplay();
    generateScript();
});

function populateDropdowns() {
    console.log('Populating dropdowns with apps:', apps);
    document.querySelectorAll('.zone-selector').forEach(select => {
        select.innerHTML = '<option value="">Choose an app...</option>';
        apps.forEach(app => {
            const option = document.createElement('option');
            option.value = app;
            option.textContent = app;
            select.appendChild(option);
        });
        
        select.addEventListener('change', function() {
            if (this.value) {
                const monitor = this.dataset.monitor;
                const zone = this.dataset.zone;
                assignAppToZone(monitor, zone, this.value);
            }
        });
    });
}

function initializeDragAndDrop() {
    console.log('Initializing drag and drop...');
    // Make app items draggable
    const appItems = document.querySelectorAll('.app-item');
    console.log('Found app items:', appItems.length);
    appItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    // Make drop zones droppable
    const dropZones = document.querySelectorAll('.drop-zone');
    console.log('Found drop zones:', dropZones.length);
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    console.log('Drag start:', e.target.dataset.app);
    e.dataTransfer.setData('text/plain', e.target.dataset.app);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const app = e.dataTransfer.getData('text/plain');
    const monitor = e.currentTarget.dataset.monitor;
    const zone = e.currentTarget.dataset.zone;
    
    console.log('Drop:', app, 'onto monitor', monitor, 'zone', zone);
    assignAppToZone(monitor, zone, app);
    e.currentTarget.classList.remove('drag-over');
}

function assignAppToZone(monitor, zone, app) {
    console.log('Assigning app:', app, 'to monitor:', monitor, 'zone:', zone);
    const monitorKey = 'monitor' + monitor;
    workspaceConfig[monitorKey].apps[zone] = app;
    
    updateZoneDisplay(monitor, zone, app);
    updateDropdown(monitor, zone, app);
    generateScript();
}

function updateZoneDisplay(monitor, zone, app) {
    const zoneElement = document.querySelector('[data-monitor="' + monitor + '"][data-zone="' + zone + '"]');
    if (zoneElement) {
        zoneElement.classList.add('has-app');
        zoneElement.innerHTML = '<div class="app-in-zone">' + app + '</div><button class="remove-app" onclick="removeApp(\'' + monitor + '\', \'' + zone + '\')">&times;</button>';
    }
}

function updateDropdown(monitor, zone, app) {
    const dropdown = document.querySelector('select[data-monitor="' + monitor + '"][data-zone="' + zone + '"]');
    if (dropdown) {
        dropdown.value = app;
    }
}

function removeApp(monitor, zone) {
    const monitorKey = 'monitor' + monitor;
    workspaceConfig[monitorKey].apps[zone] = null;
    
    const zoneElement = document.querySelector('[data-monitor="' + monitor + '"][data-zone="' + zone + '"]');
    zoneElement.classList.remove('has-app');
    
    const zoneNames = {
        top: 'Top Half', bottom: 'Bottom Half', full: 'Fullscreen',
        left: 'Left Half', right: 'Right Half', left3: '1/3', center3: '1/3', right3: '1/3'
    };
    
    zoneElement.innerHTML = '<div>Drop app here or click to select</div><div style="font-size: 0.8rem; color: #999;">' + (zoneNames[zone] || zone) + '</div><select class="zone-selector" data-monitor="' + monitor + '" data-zone="' + zone + '"><option value="">Choose an app...</option></select>';
    
    // Repopulate dropdown
    const newSelect = zoneElement.querySelector('.zone-selector');
    apps.forEach(app => {
        const option = document.createElement('option');
        option.value = app;
        option.textContent = app;
        newSelect.appendChild(option);
    });
    
    newSelect.addEventListener('change', function() {
        if (this.value) {
            assignAppToZone(this.dataset.monitor, this.dataset.zone, this.value);
        }
    });
    
    generateScript();
}

function generateScript() {
    let script = '-- Hammerspoon Workspace Configuration\\n';
    script += '-- Generated by Workspace Designer\\n';
    script += '-- Press the hotkey to activate your workspace!\\n\\n';
    
    // Check if current workspace has apps
    const hasApps = Object.values(workspaceConfig).some(monitor => 
        Object.values(monitor.apps).some(app => app !== null)
    );
    
    if (hasApps) {
        const luaKeys = currentHotkey.keys.map(k => '"' + k + '"').join(',');
        script += 'hs.hotkey.bind({' + luaKeys + '}, "' + currentHotkey.trigger + '", function()\\n';
        script += '  -- Close all apps except essentials\\n';
        script += '  local toKeep = { ["Hammerspoon"]=true, ["Finder"]=true }\\n';
        script += '  for _, app in ipairs(hs.application.runningApplications()) do\\n';
        script += '    local name = app:name()\\n';
        script += '    if name and not toKeep[name] then app:kill() end\\n';
        script += '  end\\n\\n';
        
        script += '  hs.timer.doAfter(3, function()\\n';
        script += '    local screens = {\\n';
        script += '      one = hs.screen.find(5),\\n';
        script += '      two = hs.screen.find(2),\\n';
        script += '      three = hs.screen.find(3),\\n';
        script += '      four = hs.screen.find(1)\\n';
        script += '    }\\n\\n';
        
        // Launch apps
        const allApps = new Set();
        Object.values(workspaceConfig).forEach(monitor => {
            Object.values(monitor.apps).forEach(app => {
                if (app) allApps.add(app);
            });
        });
        
        allApps.forEach(app => {
            script += '    hs.application.launchOrFocus("' + app + '")\\n';
        });
        
        script += '\\n    -- Window placement after delay\\n';
        script += '    hs.timer.doAfter(5, function()\\n';
        script += '      -- Add window placement logic here\\n';
        script += '    end)\\n';
        script += '  end)\\n';
        script += 'end)';
    } else {
        script += '-- Configure your workspace above to generate Lua code';
    }
    
    document.getElementById('generatedCode').textContent = script;
}

// Simplified functions for now
function initializeSplitSelectors() {
    // Will implement split functionality later
}

function savePreset() {
    alert('Preset saving will be implemented shortly');
}

function loadPresets() {
    // Will implement preset loading later
}

function updatePresetDisplay() {
    document.getElementById('hotkeyDisplay').textContent = currentHotkey.display;
    document.getElementById('presetDesc').textContent = currentPresetName + ' - Configure your apps';
}

function copyScript() {
    const code = document.getElementById('generatedCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('Script copied to clipboard!');
    });
}

function downloadScript() {
    const code = document.getElementById('generatedCode').textContent;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hammerspoon-config.lua';
    a.click();
    URL.revokeObjectURL(url);
}