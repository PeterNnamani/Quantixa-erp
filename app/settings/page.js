'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsPage;
var react_1 = require("react");
var app_layout_1 = require("@/components/layout/app-layout");
var context_1 = require("@/lib/context");
var utils_1 = require("@/lib/utils");
var rbac_1 = require("@/lib/rbac");
var import_utils_1 = require("@/lib/import-utils");
var sidebarSections = [
    { id: 'company', label: 'Company', description: 'Profile, branding, and legal details' },
    { id: 'business', label: 'Business', description: 'Defaults, dates, and workflow' },
    { id: 'notifications', label: 'Notifications', description: 'Email, SMS, and push' },
    { id: 'security', label: 'Security', description: 'Auth, sessions, and policies' },
    { id: 'integrations', label: 'Integrations', description: 'Payments, storage, and APIs' },
    { id: 'ai', label: 'AI Assistant', description: 'Automation and insights' },
];
function SettingsPage() {
    var _this = this;
    var _a = (0, context_1.useAccounting)(), state = _a.state, updateState = _a.updateState, addAuditLog = _a.addAuditLog;
    var _b = (0, react_1.useState)(state.openingCapital), openingCapital = _b[0], setOpeningCapital = _b[1];
    var _c = (0, react_1.useState)('company'), activeSection = _c[0], setActiveSection = _c[1];
    var _d = (0, react_1.useState)(state.roles || (0, rbac_1.getDefaultRoles)()), roles = _d[0], setRoles = _d[1];
    var _e = (0, react_1.useState)('Sales Supervisor'), roleName = _e[0], setRoleName = _e[1];
    var _f = (0, react_1.useState)('Custom'), roleTemplate = _f[0], setRoleTemplate = _f[1];
    var _g = (0, react_1.useState)(['dashboard', 'sales']), rolePermissions = _g[0], setRolePermissions = _g[1];
    var _h = (0, react_1.useState)('cashier'), previewRoleId = _h[0], setPreviewRoleId = _h[1];
    var _j = (0, react_1.useState)(false), showImportModal = _j[0], setShowImportModal = _j[1];
    var _k = (0, react_1.useState)([]), importRows = _k[0], setImportRows = _k[1];
    var _l = (0, react_1.useState)(''), importFileName = _l[0], setImportFileName = _l[1];
    var _m = (0, react_1.useState)(''), importError = _m[0], setImportError = _m[1];
    var _o = (0, react_1.useState)(0), importProgress = _o[0], setImportProgress = _o[1];
    var _p = (0, react_1.useState)('idle'), importStatus = _p[0], setImportStatus = _p[1];
    var _q = (0, react_1.useState)(null), importSummary = _q[0], setImportSummary = _q[1];
    var _r = (0, react_1.useState)(false), isImporting = _r[0], setIsImporting = _r[1];
    var selectedRole = (0, react_1.useMemo)(function () { return roles.find(function (role) { return role.id === previewRoleId; }) || roles[0]; }, [previewRoleId, roles]);
    var handleSaveOpeningCapital = function () {
        updateState({ openingCapital: parseFloat(openingCapital) || 0 });
        alert('Opening capital saved!');
    };
    var openImportModal = function () {
        setShowImportModal(true);
        setImportRows([]);
        setImportFileName('');
        setImportError('');
        setImportProgress(0);
        setImportStatus('idle');
        setImportSummary(null);
    };
    var closeImportModal = function () {
        setShowImportModal(false);
        setImportError('');
        setImportProgress(0);
        setImportStatus('idle');
        setImportSummary(null);
    };
    var handleSettingsFileChange = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var file, rows, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
                    if (!file) {
                        return [2 /*return*/];
                    }
                    setImportError('');
                    setImportProgress(0);
                    setImportStatus('idle');
                    setImportSummary(null);
                    if (!file.name.match(/\.(csv|xls|xlsx)$/i)) {
                        setImportError('Please upload a CSV or Excel file (.csv, .xls, .xlsx).');
                        setImportRows([]);
                        setImportFileName('');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, import_utils_1.parseSpreadsheetFile)(file)];
                case 2:
                    rows = _b.sent();
                    if (rows.length === 0) {
                        setImportError('No rows were found in the selected file.');
                        setImportRows([]);
                        setImportFileName(file.name);
                        return [2 /*return*/];
                    }
                    setImportRows(rows);
                    setImportFileName(file.name);
                    setImportError('');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    setImportError('Unable to parse the spreadsheet. Please verify the file format and try again.');
                    setImportRows([]);
                    setImportFileName(file.name);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var postJsonWithProgress = function (url, body, onProgress) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.upload.onprogress = function (event) {
                if (event.lengthComputable) {
                    onProgress(Math.round((event.loaded / event.total) * 80));
                }
            };
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    }
                    catch (error) {
                        reject(new Error('Invalid server response'));
                    }
                }
                else {
                    reject(new Error(xhr.responseText || "Upload failed with status ".concat(xhr.status)));
                }
            };
            xhr.onerror = function () {
                reject(new Error('Network error during upload.'));
            };
            xhr.send(JSON.stringify(body));
        });
    };
    var handleImportUpload = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, payload, summary, result, nextCustomerList, nextSupplierList, nextInventory, nextStaff, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (importRows.length === 0) {
                        setImportError('Please select a spreadsheet to import.');
                        return [2 /*return*/];
                    }
                    setImportError('');
                    setImportStatus('uploading');
                    setIsImporting(true);
                    setImportProgress(8);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = (0, import_utils_1.prepareGenericImportPayload)(importRows), payload = _a.payload, summary = _a.summary;
                    setImportSummary(summary);
                    return [4 /*yield*/, postJsonWithProgress('/api/import', payload, function (percent) {
                            setImportProgress(percent);
                        })];
                case 2:
                    result = _b.sent();
                    if (!(result === null || result === void 0 ? void 0 : result.success)) {
                        throw new Error((result === null || result === void 0 ? void 0 : result.error) || 'Import failed');
                    }
                    setImportProgress(100);
                    setImportStatus('success');
                    setTimeout(function () { return setImportProgress(100); }, 200);
                    nextCustomerList = Array.from(new Set(__spreadArray(__spreadArray([], state.customerList, true), (payload.contacts || []).filter(function (item) { return item.type === 'customer'; }).map(function (item) { return String(item.name || ''); }), true))).filter(Boolean);
                    nextSupplierList = Array.from(new Set(__spreadArray(__spreadArray([], state.supplierList, true), (payload.contacts || []).filter(function (item) { return item.type === 'supplier'; }).map(function (item) { return String(item.name || ''); }), true))).filter(Boolean);
                    nextInventory = __spreadArray(__spreadArray([], state.inventory, true), (payload.products || []).map(function (product) { return ({
                        product: String(product.name || product.sku || 'Imported Item'),
                        dept: String(product.category || product.dept || 'General'),
                        openQty: Number(product.stock_qty || product.openQty || product.closing || 0),
                        purchased: Number(product.purchased || 0),
                        sold: Number(product.sold || 0),
                        unitCost: Number(product.unit_cost || product.unitCost || 0),
                        closing: Number(product.stock_qty || product.closing || 0),
                    }); }), true);
                    nextStaff = __spreadArray(__spreadArray([], state.staffMembers, true), (payload.staff || []).map(function (staff) { return ({
                        id: staff.id || '',
                        name: String(staff.name || staff.fullName || staff.full_name || 'Imported Staff'),
                        staffId: String(staff.staffId || staff.employeeId || staff.employee_id || ''),
                        pin: String(staff.pin || ''),
                        roleId: String(staff.roleId || staff.role_id || staff.role || 'staff'),
                        roleName: String(staff.roleName || staff.role_name || staff.role || 'Staff'),
                        permissions: staff.permissions || ['dashboard'],
                        dataScope: staff.dataScope || 'team',
                        status: staff.status || 'active',
                        createdAt: String(staff.createdAt || staff.created_at || new Date().toISOString()),
                        username: String(staff.username || ''),
                        branch: String(staff.branch || ''),
                        department: String(staff.department || ''),
                        position: String(staff.position || ''),
                        phone: String(staff.phone || ''),
                        email: String(staff.email || ''),
                    }); }), true);
                    updateState({
                        sales: __spreadArray(__spreadArray([], state.sales, true), (payload.sales || []), true),
                        purchases: __spreadArray(__spreadArray([], state.purchases, true), (payload.purchases || []), true),
                        inventory: nextInventory,
                        supplierList: nextSupplierList,
                        customerList: nextCustomerList,
                        staffMembers: nextStaff,
                    });
                    addAuditLog('IMPORT', 'SETTINGS', 'GENERIC_IMPORT', "Imported ".concat(importFileName, " with ").concat(summary.sales, " sales, ").concat(summary.purchases, " purchases, ").concat(summary.products, " inventory, ").concat(summary.staff, " staff, ").concat(summary.contacts, " contacts."));
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _b.sent();
                    setImportStatus('error');
                    setImportError(error_2 instanceof Error ? error_2.message : String(error_2));
                    return [3 /*break*/, 5];
                case 4:
                    setIsImporting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleCreateRole = function () {
        var nextRole = {
            id: roleName.toLowerCase().replace(/\s+/g, '-'),
            name: roleName,
            description: "".concat(roleName, " role"),
            permissions: rolePermissions,
            dataScope: 'team',
            template: roleTemplate,
        };
        var nextRoles = __spreadArray(__spreadArray([], roles, true), [nextRole], false);
        setRoles(nextRoles);
        updateState({ roles: nextRoles });
        (0, rbac_1.saveRoles)(nextRoles);
        alert("Role ".concat(roleName, " created."));
    };
    var togglePermission = function (permission) {
        setRolePermissions(function (current) {
            return current.includes(permission) ? current.filter(function (item) { return item !== permission; }) : __spreadArray(__spreadArray([], current, true), [permission], false);
        });
    };
    return (<app_layout_1.default>
      <div className="page-shell">
        <div className="page-hero">
          <div>
            <div className="eyebrow">System Control Center</div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Fine-tune your company profile, operational defaults, security posture, and automation in one place.</p>
          </div>
          <button className="action-btn primary" type="button" onClick={openImportModal}>Import data</button>
        </div>

        <div className="ai-insight">
          <div>
            <span className="ai-badge">AURA AI Insight</span>
            <h3>Your fiscal year closes in 14 days. Review tax, reporting, and approval settings ahead of the closing window.</h3>
          </div>
          <div className="ai-pill">Planning Alert</div>
        </div>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {sidebarSections.map(function (section) { return (<button key={section.id} className={"sidebar-item ".concat(activeSection === section.id ? 'active' : '')} onClick={function () { return setActiveSection(section.id); }}>
                <span className="sidebar-title">{section.label}</span>
                <span className="sidebar-subtitle">{section.description}</span>
              </button>); })}
          </aside>

          <div className="settings-content">
            {activeSection === 'company' && (<div className="panel-card">
                <div className="panel-title">Company profile</div>
                <div className="form-grid two-up">
                  <div className="fg"><label>Business name</label><input value="QUANTIXA" readOnly/></div>
                  <div className="fg"><label>RC Number</label><input value="RC 123456" readOnly/></div>
                  <div className="fg"><label>TIN</label><input value="NG-001234567" readOnly/></div>
                  <div className="fg"><label>Country</label><input value="Nigeria" readOnly/></div>
                  <div className="fg"><label>Currency</label><input value="₦" readOnly/></div>
                  <div className="fg"><label>Timezone</label><input value="WAT" readOnly/></div>
                </div>
              </div>)}

            {activeSection === 'business' && (<div className="panel-card">
                <div className="panel-title">Business preferences</div>
                <div className="form-grid two-up">
                  <div className="fg"><label>Decimal Places</label><input value="2" readOnly/></div>
                  <div className="fg"><label>Date Format</label><input value="DD/MM/YYYY" readOnly/></div>
                  <div className="fg"><label>Tax Inclusive</label><input value="Enabled" readOnly/></div>
                  <div className="fg"><label>Default Branch</label><input value="Lagos HQ" readOnly/></div>
                </div>
                <div className="form-stack">
                  <div className="fg">
                    <label>Opening balance / capital</label>
                    <div className="inline-actions">
                      <input type="number" value={openingCapital} onChange={function (e) { return setOpeningCapital(parseFloat(e.target.value) || 0); }}/>
                      <button className="action-btn primary" onClick={handleSaveOpeningCapital}>Save</button>
                    </div>
                    <div className="metric-note">Current: {(0, utils_1.formatCurrency)(state.openingCapital)}</div>
                  </div>
                </div>
              </div>)}

            {activeSection === 'notifications' && (<div className="panel-card">
                <div className="panel-title">Notification settings</div>
                <div className="toggle-list">
                  <div className="toggle-row"><span>Email</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>SMS</span><span className="status-pill">Off</span></div>
                  <div className="toggle-row"><span>Push notifications</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>WhatsApp</span><span className="status-pill active">Enabled</span></div>
                </div>
              </div>)}

            {activeSection === 'security' && (<div className="panel-card">
                <div className="panel-title">Security controls</div>
                <div className="toggle-list">
                  <div className="toggle-row"><span>Two-factor authentication</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>Session timeout</span><span className="status-pill">20 mins</span></div>
                  <div className="toggle-row"><span>Audit logs</span><span className="status-pill active">Active</span></div>
                  <div className="toggle-row"><span>IP restrictions</span><span className="status-pill">Configurable</span></div>
                </div>
              </div>)}

            {activeSection === 'integrations' && (<div className="panel-card">
                <div className="panel-title">Integrations</div>
                <div className="option-grid compact">
                  <div className="option-card">Paystack</div>
                  <div className="option-card">Moniepoint</div>
                  <div className="option-card">Flutterwave</div>
                  <div className="option-card">Google Drive</div>
                </div>
              </div>)}

            {activeSection === 'ai' && (<div className="panel-card">
                <div className="panel-title">AI assistant settings</div>
                <div className="toggle-list">
                  <div className="toggle-row"><span>Enable AI</span><span className="status-pill active">On</span></div>
                  <div className="toggle-row"><span>Voice assistant</span><span className="status-pill active">On</span></div>
                  <div className="toggle-row"><span>Auto insights</span><span className="status-pill active">Enabled</span></div>
                  <div className="toggle-row"><span>Business memory</span><span className="status-pill">Limited</span></div>
                </div>
              </div>)}
          </div>

          {showImportModal && (<div className="import-modal-overlay">
              <div className="import-modal-card">
                <div className="modal-header">
                  <div>
                    <div className="card-title">Import data</div>
                    <div className="section-subtitle">Upload a spreadsheet and the system will route rows to sales, purchases, inventory, staff, or contact records automatically.</div>
                  </div>
                </div>

                <div className="import-modal-body">
                  <label className="file-upload-label">
                    Select spreadsheet file
                    <input type="file" accept=".csv,.xls,.xlsx" onChange={handleSettingsFileChange}/>
                  </label>

                  {importFileName && <div className="import-file-name">Selected file: {importFileName}</div>}
                  {importError && <div className="import-error">{importError}</div>}

                  <div className="import-preview-info">
                    <div>Rows loaded: {importRows.length}</div>
                    <div>Status: {importStatus === 'success' ? 'Completed' : importStatus === 'uploading' ? 'Uploading' : importStatus === 'error' ? 'Failed' : 'Ready'}</div>
                  </div>

                  <div className="progress-bar import-progress-bar">
                    <div className="progress-fill import-progress-fill" style={{ width: "".concat(importProgress, "%") }}/>
                  </div>
                  <div className="progress-label">{importProgress}%</div>

                  {importStatus === 'success' && importSummary && (<div className="import-success-card">
                      <div className="check-circle">✓</div>
                      <div>
                        <div className="success-title">Import completed</div>
                        <div className="success-detail">Sales {importSummary.sales}, Purchases {importSummary.purchases}, Inventory {importSummary.products}, Staff {importSummary.staff}, Contacts {importSummary.contacts}.</div>
                      </div>
                    </div>)}
                </div>

                <div className="btn-group">
                  <button className="btn btn-secondary" type="button" onClick={closeImportModal}>Cancel</button>
                  <button className="btn btn-primary" type="button" onClick={handleImportUpload} disabled={importRows.length === 0 || isImporting || importStatus === 'success'}>
                    {importStatus === 'uploading' ? 'Uploading…' : importStatus === 'success' ? 'Done' : 'Start import'}
                  </button>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </app_layout_1.default>);
}
