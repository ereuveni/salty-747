class B747_8_MFD extends BaseAirliners {
    constructor() {
        super();
        this.initDuration = 11000;
    }
    get templateID() { return "B747_8_MFD"; }
    get IsGlassCockpit() { return true; }
    connectedCallback() {
        super.connectedCallback();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                new B747_8_MFD_MainPage()
            ]),
        ];
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
        switch (_event) {
            case "CLR_Long":
                this.currentInteractionState = 0;
                this.popUpElement = null;
                this.overridePage = null;
                this.currentEventLinkedPageGroup = null;
                this.currentPageGroupIndex = 0;
                this.getCurrentPageGroup().pageIndex = 0;
                break;
        }
    }
    Update() {
        super.Update();
    }
}
class B747_8_MFD_MainElement extends NavSystemElement {
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class B747_8_MFD_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new B747_8_MFD_MainElement());
        this.forceMapUpdate = false;
        this.mapIsCentered = false;
        this.wxRadarOn = false;
        this.terrainOn = false;
        this.mapMode = -1;
        this.mapRange = -1;
        this.mapConfigId = 0;
        this.modeChangeTimer = -1;
        this.map = new B747_8_MFD_Map();
        this.compass = new B747_8_MFD_Compass();
        this.info = new B747_8_MFD_NDInfo();
        this.element = new NavSystemElementGroup([
            this.map,
            this.compass,
            this.info
        ]);
    }
    init() {
        super.init();
        this.modeChangeMask = this.gps.getChildById("ModeChangeMask");
        this.map.instrument.showRoads = false;
        this.map.instrument.showObstacles = false;
        this.map.instrument.showVORs = false;
        this.map.instrument.showIntersections = false;
        this.map.instrument.showNDBs = false;
        this.map.instrument.showAirports = false;
        this.map.instrument.showAirspaces = false;
        this.map.instrument.intersectionMaxRange = Infinity;
        this.map.instrument.vorMaxRange = Infinity;
        this.map.instrument.ndbMaxRange = Infinity;
        this.map.instrument.smallAirportMaxRange = Infinity;
        this.map.instrument.medAirportMaxRange = Infinity;
        this.map.instrument.largeAirportMaxRange = Infinity;
        SimVar.SetSimVarValue("L:B747_8_MFD_NAV_MODE", "number", 2);

        this.trkBox = document.querySelector("#trk-box");
        this.mapBox = document.querySelector("#map-box");
        this.mapInstrument = document.querySelector("map-instrument");
        this.irsTimes = document.querySelector("#irs-times");
        this.leftIRSValue = document.querySelector("#l-irs-value");
        this.centerIRSValue = document.querySelector("#c-irs-value");
        this.rightIRSValue = document.querySelector("#r-irs-value");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.updateMap(_deltaTime);
        this.updateNDInfo(_deltaTime);
        this.updateAltitudeRangeArc(_deltaTime);

        const IRSState = SimVar.GetSimVarValue("L:SALTY_IRS_STATE", "Enum");
        const IRSMinutesLeft = Math.floor(SimVar.GetSimVarValue("L:SALTY_IRS_TIME_LEFT", "Enum") / 60);

        if (IRSState == 0) {
            this.mapBox.style.display = "";
            this.trkBox.style.display = "";
            this.irsTimes.style.display = "none";
            this.mapInstrument.style.display = "none";
        }
        if (IRSState == 1) {
            this.trkBox.style.display = "none";
            this.mapInstrument.style.display = "none";
            this.irsTimes.style.display = "";
            this.leftIRSValue.textContent = IRSMinutesLeft;
            this.centerIRSValue.textContent = IRSMinutesLeft;
            this.rightIRSValue.textContent = IRSMinutesLeft;
        }
        if (IRSState == 2) {
            this.mapBox.style.display = "none";
            this.trkBox.style.display = "none";
            this.mapInstrument.style.display = "";
            this.irsTimes.style.display = "none";
        }
    }
    onEvent(_event) {
        switch (_event) {
            case "KNOB_AUTOPILOT_CTR":
                if (this.mapMode != Jet_NDCompass_Display.PLAN) {
                    this.mapIsCentered = !this.mapIsCentered;
                    this.forceMapUpdate = true;
                }
                break;
            case "KNOB_RANGE_TFC":
                this.map.instrument.showTraffic = !this.map.instrument.showTraffic;
                break;
            case "BTN_WXR":
                if (this.wxRadarOn) {
                    SimVar.SetSimVarValue("L:BTN_WX_ACTIVE", "number", 0);
                }
                else {
                    SimVar.SetSimVarValue("L:BTN_WX_ACTIVE", "number", 1);
                    SimVar.SetSimVarValue("L:BTN_TERRONND_ACTIVE", "number", 0);
                }
                break;
            case "BTN_STA":
                this.map.instrument.showNDBs = !this.map.instrument.showNDBs;
                this._updateNDFiltersStatuses();
                break;
            case "BTN_WPT":
                this.map.instrument.showIntersections = !this.map.instrument.showIntersections;
                this._updateNDFiltersStatuses();
                break;
            case "BTN_ARPT":
                this.map.instrument.showAirports = !this.map.instrument.showAirports;
                this._updateNDFiltersStatuses();
                break;
            case "BTN_DATA":
                this.map.instrument.showConstraints = !this.map.instrument.showConstraints;
                this._updateNDFiltersStatuses();
                break;
            case "BTN_POS":
                this.map.instrument.showVORs = !this.map.instrument.showVORs;
                this._updateNDFiltersStatuses();
                break;
            case "BTN_TERR":
                if (this.terrainOn) {
                    SimVar.SetSimVarValue("L:BTN_TERRONND_ACTIVE", "number", 0);
                }
                else {
                    SimVar.SetSimVarValue("L:BTN_TERRONND_ACTIVE", "number", 1);
                    SimVar.SetSimVarValue("L:BTN_WX_ACTIVE", "number", 0);
                }
                break;
        }
    }
    _updateNDFiltersStatuses() {
        SimVar.SetSimVarValue("L:BTN_CSTR_FILTER_ACTIVE", "number", this.map.instrument.showConstraints ? 1 : 0);
        SimVar.SetSimVarValue("L:BTN_VORD_FILTER_ACTIVE", "number", this.map.instrument.showVORs ? 1 : 0);
        SimVar.SetSimVarValue("L:BTN_WPT_FILTER_ACTIVE", "number", this.map.instrument.showIntersections ? 1 : 0);
        SimVar.SetSimVarValue("L:BTN_NDB_FILTER_ACTIVE", "number", this.map.instrument.showNDBs ? 1 : 0);
        SimVar.SetSimVarValue("L:BTN_ARPT_FILTER_ACTIVE", "number", this.map.instrument.showAirports ? 1 : 0);
    }
    updateMap(_deltaTime) {
        if (this.modeChangeMask && this.modeChangeTimer >= 0) {
            this.modeChangeTimer -= _deltaTime / 1000;
            if (this.modeChangeTimer <= 0) {
                this.modeChangeMask.style.display = "none";
                this.modeChangeTimer = -1;
            }
        }
        var wxRadarOn = SimVar.GetSimVarValue("L:BTN_WX_ACTIVE", "bool");
        var terrainOn = SimVar.GetSimVarValue("L:BTN_TERRONND_ACTIVE", "number");
        var mapMode = SimVar.GetSimVarValue("L:B747_8_MFD_NAV_MODE", "number");
        var mapRange = SimVar.GetSimVarValue("L:B747_8_MFD_Range", "number");
        if (this.wxRadarOn != wxRadarOn || this.terrainOn != terrainOn || this.mapMode != mapMode || this.forceMapUpdate) {
            this.wxRadarOn = wxRadarOn;
            this.terrainOn = terrainOn;
            this.mapMode = mapMode;
            this.forceMapUpdate = false;
            this.setMapMode(this.mapIsCentered, this.mapMode);
            if (this.terrainOn) {
                this.mapConfigId = 1;
            }
            else if (this.wxRadarOn) {
                this.showWeather();
            }
            else {
                this.mapConfigId = 0;
            }
            if (this.compass.svg.displayMode === Jet_NDCompass_Display.ARC) {
                this.map.showCompassMask();
                this.map.hidePlanMask();
            }
            else {
                this.map.showPlanMask();
                this.map.hideCompassMask();
            }
            if (this.modeChangeMask) {
                this.modeChangeMask.style.display = "block";
                this.modeChangeTimer = 0.15;
            }
        }
        switch (this.mapConfigId) {
            case 0:
                if (this.map.instrument.mapConfigId != 0) {
                    this.map.instrument.mapConfigId = 0;
                    this.map.instrument.bingMapRef = EBingReference.SEA;
                }
                break;
            case 1:
                let altitude = Simplane.getAltitudeAboveGround();
                if (altitude >= 500 && this.map.instrument.mapConfigId != 1) {
                    this.map.instrument.mapConfigId = 1;
                    this.map.instrument.bingMapRef = EBingReference.PLANE;
                }
                else if (altitude < 490 && this.map.instrument.mapConfigId != 0) {
                    this.map.instrument.mapConfigId = 0;
                    this.map.instrument.bingMapRef = EBingReference.SEA;
                }
                break;
        }
        if (this.mapRange != mapRange) {
            this.mapRange = mapRange;
            this.map.instrument.setZoom(this.mapRange);
            this.compass.svg.mapRange = this.map.zoomRanges[this.mapRange];
        }
    }
    setMapMode(_centered, _mode) {
        SimVar.SetSimVarValue("L:B747_MAP_MODE", "number", _mode);
        switch (_mode) {
            case 0:
                if (_centered) {
                    this.compass.svg.setMode(Jet_NDCompass_Display.ROSE, Jet_NDCompass_Navigation.ILS);
                    this.map.setMode(Jet_NDCompass_Display.ROSE);
                }
                else {
                    this.compass.svg.setMode(Jet_NDCompass_Display.ARC, Jet_NDCompass_Navigation.ILS);
                    this.map.setMode(Jet_NDCompass_Display.ARC);
                }
                this.info.setMode(Jet_NDCompass_Navigation.ILS);
                break;
            case 1:
                if (_centered) {
                    this.compass.svg.setMode(Jet_NDCompass_Display.ROSE, Jet_NDCompass_Navigation.VOR);
                    this.map.setMode(Jet_NDCompass_Display.ROSE);
                }
                else {
                    this.compass.svg.setMode(Jet_NDCompass_Display.ARC, Jet_NDCompass_Navigation.VOR);
                    this.map.setMode(Jet_NDCompass_Display.ARC);
                }
                this.info.setMode(Jet_NDCompass_Navigation.VOR);
                break;
            case 2:
                if (_centered) {
                    this.compass.svg.setMode(Jet_NDCompass_Display.ROSE, Jet_NDCompass_Navigation.NAV);
                    this.map.setMode(Jet_NDCompass_Display.ROSE);
                }
                else {
                    this.compass.svg.setMode(Jet_NDCompass_Display.ARC, Jet_NDCompass_Navigation.NAV);
                    this.map.setMode(Jet_NDCompass_Display.ARC);
                }
                this.info.setMode(Jet_NDCompass_Navigation.NAV);
                break;
            case 3:
                this.compass.svg.setMode(Jet_NDCompass_Display.PLAN, Jet_NDCompass_Navigation.NAV);
                this.map.setMode(Jet_NDCompass_Display.PLAN);
                this.info.setMode(Jet_NDCompass_Navigation.NAV);
                break;
        }
        if (_mode == 3)
            this.gps.setAttribute("mapstyle", "plan");
        else if (_centered)
            this.gps.setAttribute("mapstyle", "rose");
        else
            this.gps.setAttribute("mapstyle", "arc");
        this.compass.svg.showArcRange(false);
        SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1);
    }
    showWeather() {
        this.setMapMode(this.mapIsCentered, this.mapMode);
        this.compass.svg.showArcRange(true);
        this.map.showWeather();
    }
    updateNDInfo(_deltaTime) {
        this.info.showSymbol(B747_8_ND_Symbol.WXR, this.wxRadarOn);
        this.info.showSymbol(B747_8_ND_Symbol.WXRINFO, this.wxRadarOn);
        this.info.showSymbol(B747_8_ND_Symbol.TERR, this.terrainOn);
        this.info.showSymbol(B747_8_ND_Symbol.STA, this.map.instrument.showNDBs);
        this.info.showSymbol(B747_8_ND_Symbol.WPT, this.map.instrument.showIntersections);
        this.info.showSymbol(B747_8_ND_Symbol.ARPT, this.map.instrument.showAirports);
    }
    updateAltitudeRangeArc(_deltaTime) {
        this.greenArc = document.querySelector("#altitudeRangeArc");
        if ((SimVar.GetSimVarValue("L:B747_MAP_MODE", "number") == 2)) {   

            //Get SimVars for arc position calculation - speeds in feet per second
            let arcDeltaAlt = Math.abs((Simplane.getAutoPilotDisplayedAltitudeLockValue()) - (Simplane.getAltitude()));
            let arcVerticalSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per second");
            let arcGroundSpeed = (SimVar.GetSimVarValue("GPS GROUND SPEED", "meters per second") * 3.28084);
            let mapRange = SimVar.GetSimVarValue("L:B747_8_MFD_Range", "number");
            switch(mapRange) {
                case 0:
                    mapRange = 0.25;
                    break;
                case 1:
                    mapRange = 0.5;
                    break;
                case 2:
                    mapRange = 1;
                    break;
                case 3:
                    mapRange = 2;
                    break;
                case 4:
                    mapRange = 5;
                    break;
                case 5:
                    mapRange = 10;
                    break;
                case 6:
                    mapRange = 20;
                    break;
                case 7:
                    mapRange = 40;
                    break;
                case 8:
                    mapRange = 80;
                    break;
                case 9:
                    mapRange = 160;
                    break;
                case 10:
                    mapRange = 320;
                    break;
                case 11:
                    mapRange = 640;
                    break;
            }
                 
            //Calculate arc position and generate Y coord
            let arcFPA = Math.atan(arcVerticalSpeed / arcGroundSpeed);
            let distanceToLevelArc = Math.abs(((arcDeltaAlt / Math.tan(arcFPA)) * 0.000164579));
            let arcYcoord = 600 - ((distanceToLevelArc / mapRange) * 600);

            //Transform arc element - Scales X down linearly with Y until minimum width 120px - Translates in Y axis corrected for compass height 414px with 56px offset
            this.greenArc.setAttribute("d", `M ${Math.min(-60, (1 - (arcYcoord / 414)) * -150)} 50, Q 0 0, ${Math.max(60, (1 - (arcYcoord / 414)) * 150)} 50`);
            this.greenArc.setAttribute("transform", `translate(0, ${((arcYcoord * 414 / 600) + 56)})`);
            
            //Hides arc if out of compass bounds or aircraft considered at desired level
            if((arcYcoord > 600) || (arcYcoord <= 1) || (arcDeltaAlt <= 100)){
                this.greenArc.style.visibility ="hidden";
            }
            else{ 
                this.greenArc.style.visibility ="visible";
            }

            this.debug1 = document.querySelector("#debug1");
            this.debug2 = document.querySelector("#debug2");
            this.debug3 = document.querySelector("#debug3");
            this.debug4 = document.querySelector("#debug4");
            this.debug5 = document.querySelector("#debug5");
            this.debug6 = document.querySelector("#debug6");
            this.debug7 = document.querySelector("#debug7");
            this.debug8 = document.querySelector("#debug8");

            /*this.debug1.textContent = "DELTA ALT " + arcDeltaAlt;
            this.debug2.textContent = "VS " + arcVerticalSpeed;
            this.debug3.textContent = "GS " + arcGroundSpeed;
            this.debug4.textContent = "FPA " + arcFPA;
            this.debug5.textContent = "DISTANCE TO GO " + distanceToLevelArc;
            this.debug6.textContent = "MAP RANGE " + mapRange;
            this.debug7.textContent = "ARC Y " + arcYcoord;
            this.debug8.textContent = "ARC X ";*/
        }
        else{ 
            this.greenArc.style.visibility ="hidden";
        }
    }
}
class B747_8_MFD_Compass extends NavSystemElement {
    init(root) {
        this.svg = this.gps.getChildById("Compass");
        this.svg.aircraft = Aircraft.B747_8;
        this.svg.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.svg.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class B747_8_MFD_Map extends MapInstrumentElement {
    constructor() {
        super(...arguments);
        this.zoomRanges = [0.25, 0.5, 1, 2, 5, 10, 20, 40, 80, 160, 320, 640];
    }
    init(root) {
        super.init(root);
    }
    onTemplateLoaded() {
        super.onTemplateLoaded();
        this.compassModeMask = new SvgBottomMaskElement("b747-compass-mask", 0, 30);
        this.planModeMask = new SvgPlanMaskElement("b747-plan-mask", 0, -45);
    }
    getAdaptiveRanges(_factor) {
        let ranges = Array.from(this.zoomRanges);
        for (let i = 0; i < ranges.length; i++)
            ranges[i] *= _factor;
        return ranges;
    }
    setMode(display) {
        this.hideWeather();
        this.display = display;
        switch (display) {
            case Jet_NDCompass_Display.ROSE:
                {
                    this.instrument.zoomRanges = this.getAdaptiveRanges(2.0);
                    this.instrument.style.top = "0%";
                    this.instrument.rotateWithPlane(true);
                    this.instrument.centerOnActiveWaypoint(false);
                    this.instrument.setPlaneScale(2.25);
                    break;
                }
            case Jet_NDCompass_Display.ARC:
                {
                    this.instrument.zoomRanges = this.getAdaptiveRanges(2.15);
                    this.instrument.style.top = "25%";
                    this.instrument.rotateWithPlane(true);
                    this.instrument.centerOnActiveWaypoint(false);
                    this.instrument.setPlaneScale(2.75);
                    break;
                }
            case Jet_NDCompass_Display.PLAN:
                {
                    this.instrument.zoomRanges = this.getAdaptiveRanges(2.2);
                    this.instrument.style.top = "0%";
                    this.instrument.rotateWithPlane(false);
                    this.instrument.centerOnActiveWaypoint(true);
                    this.instrument.setPlaneScale(1.5);
                    break;
                }
            default:
                this.instrument.style.top = "0%";
                this.instrument.rotateWithPlane(false);
                this.instrument.centerOnActiveWaypoint(false);
                this.instrument.setPlaneScale(1.0);
                break;
        }
    }
    showWeather() {
        this.instrument.showWeatherWithGPS(EWeatherRadar.HORIZONTAL, Math.PI * 2.0);
        this.instrument.setBingMapStyle("2.25%", "4.0%", "92%", "92%");
    }
    hideWeather() {
        if (this.instrument.getWeather() != EWeatherRadar.OFF) {
            this.instrument.showWeather(EWeatherRadar.OFF);
        }
    }
    showCompassMask() {
        if (this.compassModeMask) {
            if (this.instrument.maskElements.indexOf(this.compassModeMask) === -1) {
                this.instrument.maskElements.push(this.compassModeMask);
            }
        }
    }
    hideCompassMask() {
        if (this.compassModeMask) {
            let maskIndex = this.instrument.maskElements.indexOf(this.compassModeMask);
            if (maskIndex !== -1) {
                this.instrument.maskElements.splice(maskIndex, 1);
            }
        }
    }
    showPlanMask() {
        if (this.planModeMask) {
            if (this.instrument.maskElements.indexOf(this.planModeMask) === -1) {
                this.instrument.maskElements.push(this.planModeMask);
            }
            if (this.display == Jet_NDCompass_Display.ROSE)
                this.planModeMask.offset(0, -45);
            else
                this.planModeMask.offset(0, -15);
        }
    }
    hidePlanMask() {
        if (this.planModeMask) {
            let maskIndex = this.instrument.maskElements.indexOf(this.planModeMask);
            if (maskIndex !== -1) {
                this.instrument.maskElements.splice(maskIndex, 1);
            }
        }
    }
}
var B747_8_ND_Symbol;
(function (B747_8_ND_Symbol) {
    B747_8_ND_Symbol[B747_8_ND_Symbol["ARPT"] = 0] = "ARPT";
    B747_8_ND_Symbol[B747_8_ND_Symbol["WPT"] = 1] = "WPT";
    B747_8_ND_Symbol[B747_8_ND_Symbol["STA"] = 2] = "STA";
    B747_8_ND_Symbol[B747_8_ND_Symbol["TERR"] = 3] = "TERR";
    B747_8_ND_Symbol[B747_8_ND_Symbol["WXR"] = 4] = "WXR";
    B747_8_ND_Symbol[B747_8_ND_Symbol["WXRINFO"] = 5] = "WXRINFO";
})(B747_8_ND_Symbol || (B747_8_ND_Symbol = {}));
class B747_8_MFD_NDInfo extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.allSymbols = new Array();
    }
    init(root) {
        this.ndInfo = this.gps.getChildById("NDInfo");
        this.ndInfo.aircraft = Aircraft.B747_8;
        this.ndInfo.gps = this.gps;
        this.allSymbols.push(this.ndInfo.querySelector("#ARPT"));
        this.allSymbols.push(this.ndInfo.querySelector("#WPT"));
        this.allSymbols.push(this.ndInfo.querySelector("#STA"));
        this.allSymbols.push(this.ndInfo.querySelector("#TERR"));
        this.allSymbols.push(this.ndInfo.querySelector("#WXR"));
        this.allSymbols.push(this.ndInfo.querySelector("#WXRInfo"));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.ndInfo != null) {
            this.ndInfo.update(_deltaTime);
        }

        var IRSState = SimVar.GetSimVarValue("L:SALTY_IRS_STATE", "Enum");
        var showData; 
        var groundSpeed = Math.round(Simplane.getGroundSpeed());
        var gs = this.ndInfo.querySelector("#GS_Value");
        const tas_text = this.ndInfo.querySelector("#TAS_Text");
        var tas_val = this.ndInfo.querySelector("#TAS_Value");

        var wd = this.ndInfo.querySelector("#Wind_Direction");
        var ws = this.ndInfo.querySelector("#Wind_Strength");
        var wa = this.ndInfo.querySelector("#Wind_Arrow");
        const sep = this.ndInfo.querySelector("#Wind_Separator");

        //get waypoint track, name, dist, etc. 
        var wpdata = this.ndInfo.querySelector("#WP_Data");

        if(IRSState != 2 || groundSpeed < 100) {
            showData = false; 
       }
       else {
           showData = true;
       }

       tas_text.setAttribute("visibility", (showData) ? "visible" : "hidden");
       tas_val.setAttribute("visibility", (showData) ? "visible" : "hidden");

       sep.setAttribute("visibility", (showData) ? "visible" : "hidden");
       wd.setAttribute("visibility", (showData) ? "visible" : "hidden");
       ws.setAttribute("visibility", (showData) ? "visible" : "hidden");
       wa.setAttribute("visibility", (showData) ? "visible" : "hidden");

       if(IRSState != 2) {
           gs.textContent = "---";
           wpdata.setAttribute("visibility", "hidden");
       }
       else {
           gs.textContent = groundSpeed.toString().padStart(3); 
           wpdata.setAttribute("visibility", "visible"); 
       }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    setMode(display) {
        if (this.ndInfo) {
            this.ndInfo.setMode(display, 0);
        }
    }
    showSymbol(_symbol, _show) {
        if (this.allSymbols[_symbol])
            this.allSymbols[_symbol].setAttribute("visibility", (_show) ? "visible" : "hidden");
    }
}
registerInstrument("b747-8-mfd-element", B747_8_MFD);
//# sourceMappingURL=B747_8_MFD.js.map