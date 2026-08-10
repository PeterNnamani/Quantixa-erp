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
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
var server_1 = require("next/server");
var supabase_server_1 = require("@/lib/supabase.server");
function normalizeContactType(value) {
    var type = (value || '').toString().trim().toLowerCase();
    if (type.includes('supplier'))
        return 'supplier';
    if (type.includes('vendor'))
        return 'vendor';
    return 'customer';
}
function findOrCreateContact(contact) {
    return __awaiter(this, void 0, void 0, function () {
        var type, name, _a, existing, existingErr, insertData, _b, inserted, insertErr;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!supabase_server_1.supabaseAdmin)
                        return [2 /*return*/, null];
                    type = normalizeContactType(contact.type || contact.contact_type || contact[''] || '');
                    name = String(contact.name || contact.full_name || contact.customer || contact.supplier || '').trim();
                    if (!name)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin
                        .from('contacts')
                        .select('id')
                        .eq('type', type)
                        .eq('name', name)
                        .limit(1)];
                case 1:
                    _a = _d.sent(), existing = _a.data, existingErr = _a.error;
                    if (existingErr) {
                        throw existingErr;
                    }
                    if (existing && existing.length > 0) {
                        return [2 /*return*/, existing[0].id];
                    }
                    insertData = {
                        type: type,
                        name: name,
                        email: contact.email || null,
                        phone: contact.phone || null,
                        address: contact.address || null,
                        credit_limit: contact.credit_limit || contact.creditLimit || 0,
                        opening_balance: contact.opening_balance || contact.openingBalance || 0,
                        is_related_party: false,
                        status: contact.status || 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin
                        .from('contacts')
                        .insert(insertData)
                        .select('id')
                        .limit(1)];
                case 2:
                    _b = _d.sent(), inserted = _b.data, insertErr = _b.error;
                    if (insertErr) {
                        throw insertErr;
                    }
                    return [2 /*return*/, ((_c = inserted === null || inserted === void 0 ? void 0 : inserted[0]) === null || _c === void 0 ? void 0 : _c.id) || null];
            }
        });
    });
}
function buildContactMap(contacts) {
    return __awaiter(this, void 0, void 0, function () {
        var map, _i, contacts_1, item, type, name_1, key, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    map = {};
                    _i = 0, contacts_1 = contacts;
                    _a.label = 1;
                case 1:
                    if (!(_i < contacts_1.length)) return [3 /*break*/, 4];
                    item = contacts_1[_i];
                    type = normalizeContactType(item.type || item.contact_type || item[''] || '');
                    name_1 = String(item.name || item.full_name || item.customer || item.supplier || '').trim();
                    if (!name_1)
                        return [3 /*break*/, 3];
                    key = "".concat(type, ":").concat(name_1);
                    if (map[key])
                        return [3 /*break*/, 3];
                    return [4 /*yield*/, findOrCreateContact(item)];
                case 2:
                    id = _a.sent();
                    if (id)
                        map[key] = id;
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, map];
            }
        });
    });
}
function findOrCreateProduct(product) {
    return __awaiter(this, void 0, void 0, function () {
        var sku, name, _a, existing, existingErr, insertData, _b, updated, updateErr, _c, inserted, insertErr;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!supabase_server_1.supabaseAdmin)
                        return [2 /*return*/, null];
                    sku = String(product.sku || product.product_code || product.item_code || product.name || '').trim();
                    name = String(product.name || product.product || product.item || '').trim();
                    if (!sku || !name)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin
                        .from('products')
                        .select('id')
                        .eq('sku', sku)
                        .limit(1)];
                case 1:
                    _a = _f.sent(), existing = _a.data, existingErr = _a.error;
                    if (existingErr) {
                        throw existingErr;
                    }
                    insertData = {
                        sku: sku,
                        name: name,
                        category: product.category || product.dept || product.department || 'General',
                        unit_cost: product.unit_cost || product.unitCost || 0,
                        unit_price: product.unit_price || product.unitPrice || 0,
                        stock_qty: product.stock_qty || product.openQty || product.closing || 0,
                        reorder_level: product.reorder_level || product.reorderLevel || 0,
                        warehouse: product.warehouse || null,
                        branch: product.branch || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    if (!(existing && existing.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin
                        .from('products')
                        .update(insertData)
                        .eq('id', existing[0].id)
                        .select('id')
                        .limit(1)];
                case 2:
                    _b = _f.sent(), updated = _b.data, updateErr = _b.error;
                    if (updateErr) {
                        throw updateErr;
                    }
                    return [2 /*return*/, ((_d = updated === null || updated === void 0 ? void 0 : updated[0]) === null || _d === void 0 ? void 0 : _d.id) || existing[0].id];
                case 3: return [4 /*yield*/, supabase_server_1.supabaseAdmin
                    .from('products')
                    .insert(insertData)
                    .select('id')
                    .limit(1)];
                case 4:
                    _c = _f.sent(), inserted = _c.data, insertErr = _c.error;
                    if (insertErr) {
                        throw insertErr;
                    }
                    return [2 /*return*/, ((_e = inserted === null || inserted === void 0 ? void 0 : inserted[0]) === null || _e === void 0 ? void 0 : _e.id) || null];
            }
        });
    });
}
function findOrCreateStaff(staff) {
    return __awaiter(this, void 0, void 0, function () {
        var staffId, username, fullName, query, _a, existing, existingErr, insertData, _b, updated, updateErr, _c, inserted, insertErr;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!supabase_server_1.supabaseAdmin)
                        return [2 /*return*/, null];
                    staffId = String(staff.staffId || staff.employeeId || staff.employee_id || '').trim();
                    username = String(staff.username || '').trim();
                    fullName = String(staff.name || staff.full_name || '').trim() || username || staffId;
                    if (!fullName)
                        return [2 /*return*/, null];
                    query = supabase_server_1.supabaseAdmin.from('users').select('id').or([
                        staffId ? "staff_id.eq.".concat(staffId) : undefined,
                        username ? "username.eq.".concat(username) : undefined,
                    ]
                        .filter(Boolean)
                        .join(','));
                    return [4 /*yield*/, query.limit(1)];
                case 1:
                    _a = _f.sent(), existing = _a.data, existingErr = _a.error;
                    if (existingErr) {
                        throw existingErr;
                    }
                    insertData = {
                        staff_id: staffId || null,
                        username: username || null,
                        email: staff.email || "".concat(username || staffId || 'imported', "@local"),
                        full_name: fullName,
                        role: String(staff.roleId || staff.role || 'staff'),
                        phone: staff.phone || null,
                        status: staff.status || 'active',
                        branch: staff.branch || null,
                        department: staff.department || null,
                        position: staff.position || null,
                        employee_id: staff.employeeId || staff.employee_id || null,
                        pin: staff.pin || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    if (!(existing && existing.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin
                        .from('users')
                        .update(insertData)
                        .eq('id', existing[0].id)
                        .select('id')
                        .limit(1)];
                case 2:
                    _b = _f.sent(), updated = _b.data, updateErr = _b.error;
                    if (updateErr) {
                        throw updateErr;
                    }
                    return [2 /*return*/, ((_d = updated === null || updated === void 0 ? void 0 : updated[0]) === null || _d === void 0 ? void 0 : _d.id) || existing[0].id];
                case 3: return [4 /*yield*/, supabase_server_1.supabaseAdmin
                    .from('users')
                    .insert(insertData)
                    .select('id')
                    .limit(1)];
                case 4:
                    _c = _f.sent(), inserted = _c.data, insertErr = _c.error;
                    if (insertErr) {
                        throw insertErr;
                    }
                    return [2 /*return*/, ((_e = inserted === null || inserted === void 0 ? void 0 : inserted[0]) === null || _e === void 0 ? void 0 : _e.id) || null];
            }
        });
    });
}
function insertSaleRecords(sales, contactMap) {
    return __awaiter(this, void 0, void 0, function () {
        var saleRows, salesErr, references, _a, storedSales, storedSalesErr, salesByRef, saleItems, saleItemsErr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase_server_1.supabaseAdmin || sales.length === 0)
                        return [2 /*return*/];
                    saleRows = sales.map(function (sale) {
                        return ({
                            reference: String(sale.reference || sale.id || '').trim() || "S-".concat(Date.now()),
                            sale_date: sale.sale_date || sale.date || new Date().toISOString().slice(0, 10),
                            customer_id: contactMap["customer:".concat(String(sale.customer || 'Unknown Customer').trim())] || null,
                            branch: sale.branch || null,
                            sales_rep: sale.sales_rep || sale.enteredBy || null,
                            payment_method: sale.paymentMethod || sale.payment_method || 'Transfer',
                            payment_status: sale.paymentStatus || sale.payment_status || 'PAID',
                            status: sale.status || 'active',
                            notes: sale.notes || null,
                            subtotal: sale.subtotal || 0,
                            tax: sale.tax || 0,
                            discount: sale.discount || 0,
                            shipping: sale.shipping || 0,
                            total_amount: sale.totalAmount || sale.total_amount || 0,
                            amount_paid: sale.amountPaid || sale.amount_paid || 0,
                            balance: sale.balance || 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    });
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin.from('sales').upsert(saleRows, { onConflict: 'reference' })];
                case 1:
                    salesErr = (_b.sent()).error;
                    if (salesErr) {
                        throw salesErr;
                    }
                    references = saleRows.map(function (row) { return row.reference; });
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin.from('sales').select('id,reference').in('reference', references)];
                case 2:
                    _a = _b.sent(), storedSales = _a.data, storedSalesErr = _a.error;
                    if (storedSalesErr)
                        throw storedSalesErr;
                    salesByRef = new Map((storedSales || []).map(function (item) { return [item.reference, item.id]; }));
                    saleItems = [];
                    sales.forEach(function (sale) {
                        var _a;
                        var reference = String(sale.reference || sale.id || '').trim() || '';
                        var saleId = salesByRef.get(reference);
                        if (!saleId)
                            return;
                        var item = (_a = sale.items) === null || _a === void 0 ? void 0 : _a[0];
                        if (!item)
                            return;
                        saleItems.push({
                            sale_id: saleId,
                            product_id: item.product_id || null,
                            product_name: String(item.product || item.product_name || item.name || 'Imported Item').trim(),
                            department: item.dept || item.department || null,
                            qty: item.qty || item.quantity || 0,
                            unit_price: item.unitPrice || item.unit_price || 0,
                            discount: item.discount || 0,
                            tax: item.tax || 0,
                            total: item.total || 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    });
                    if (!(saleItems.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin.from('sale_items').insert(saleItems)];
                case 3:
                    saleItemsErr = (_b.sent()).error;
                    if (saleItemsErr) {
                        throw saleItemsErr;
                    }
                    _b.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function insertPurchaseRecords(purchases, contactMap) {
    return __awaiter(this, void 0, void 0, function () {
        var purchaseRows, purchasesErr, references, _a, storedPurchases, storedPurchasesErr, purchasesByRef, purchaseItems, purchaseItemsErr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!supabase_server_1.supabaseAdmin || purchases.length === 0)
                        return [2 /*return*/];
                    purchaseRows = purchases.map(function (purchase) {
                        return ({
                            reference: String(purchase.reference || purchase.id || '').trim() || "P-".concat(Date.now()),
                            purchase_date: purchase.purchase_date || purchase.date || new Date().toISOString().slice(0, 10),
                            supplier_id: contactMap["supplier:".concat(String(purchase.supplier || 'Unknown Supplier').trim())] || null,
                            branch: purchase.branch || null,
                            invoice_number: purchase.invoiceNumber || purchase.invoice_number || null,
                            purchase_order: purchase.purchaseOrder || purchase.purchase_order || null,
                            payment_method: purchase.paymentMethod || purchase.payment_method || 'Cash',
                            payment_status: purchase.paymentStatus || purchase.payment_status || 'PAID',
                            status: purchase.status || 'active',
                            notes: purchase.notes || null,
                            subtotal: purchase.subtotal || 0,
                            tax: purchase.tax || 0,
                            discount: purchase.discount || 0,
                            shipping: purchase.shipping || 0,
                            total: purchase.total || 0,
                            amount_paid: purchase.amountPaid || purchase.amount_paid || 0,
                            balance: purchase.balance || 0,
                            due_date: purchase.dueDate || purchase.due_date || null,
                            created_by: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    });
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin.from('purchases').upsert(purchaseRows, { onConflict: 'reference' })];
                case 1:
                    purchasesErr = (_b.sent()).error;
                    if (purchasesErr) {
                        throw purchasesErr;
                    }
                    references = purchaseRows.map(function (row) { return row.reference; });
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin.from('purchases').select('id,reference').in('reference', references)];
                case 2:
                    _a = _b.sent(), storedPurchases = _a.data, storedPurchasesErr = _a.error;
                    if (storedPurchasesErr)
                        throw storedPurchasesErr;
                    purchasesByRef = new Map((storedPurchases || []).map(function (item) { return [item.reference, item.id]; }));
                    purchaseItems = [];
                    purchases.forEach(function (purchase) {
                        var _a;
                        var reference = String(purchase.reference || purchase.id || '').trim() || '';
                        var purchaseId = purchasesByRef.get(reference);
                        if (!purchaseId)
                            return;
                        var item = (_a = purchase.items) === null || _a === void 0 ? void 0 : _a[0];
                        if (!item)
                            return;
                        purchaseItems.push({
                            purchase_id: purchaseId,
                            product_id: item.product_id || null,
                            product_name: String(item.product || item.product_name || item.name || 'Imported Item').trim(),
                            department: item.dept || item.department || null,
                            qty: item.qty || item.quantity || 0,
                            unit_price: item.unitPrice || item.unit_price || 0,
                            discount: item.discount || 0,
                            tax: item.tax || 0,
                            total: item.total || 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    });
                    if (!(purchaseItems.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase_server_1.supabaseAdmin.from('purchase_items').insert(purchaseItems)];
                case 3:
                    purchaseItemsErr = (_b.sent()).error;
                    if (purchaseItemsErr) {
                        throw purchaseItemsErr;
                    }
                    _b.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function formatErrorMessage(error) {
    if (!error) return 'Unknown server error';
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
            return error.message;
        }
        try {
            return JSON.stringify(error);
        }
        catch (_a) {
            return String(error);
        }
    }
    return String(error);
}
function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, contacts, sales, purchases, products, staff, contactMap, _i, sales_1, sale, name_2, id, _a, purchases_1, purchase, name_3, id, _b, products_1, product, _c, staff_1, staffRow, error_1, message;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 21, , 22]);
                    if (!supabase_server_1.supabaseAdmin) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Supabase admin client is not configured' }, { status: 500 })];
                    }
                    return [4 /*yield*/, request.json()];
                case 1:
                    payload = (_d.sent());
                    contacts = Array.isArray(payload.contacts) ? payload.contacts : [];
                    sales = Array.isArray(payload.sales) ? payload.sales : [];
                    purchases = Array.isArray(payload.purchases) ? payload.purchases : [];
                    products = Array.isArray(payload.products) ? payload.products : [];
                    staff = Array.isArray(payload.staff) ? payload.staff : [];
                    return [4 /*yield*/, buildContactMap(contacts)];
                case 2:
                    contactMap = _d.sent();
                    _i = 0, sales_1 = sales;
                    _d.label = 3;
                case 3:
                    if (!(_i < sales_1.length)) return [3 /*break*/, 6];
                    sale = sales_1[_i];
                    name_2 = String(sale.customer || sale.customer_name || sale.client || sale.name || 'Unknown Customer').trim();
                    if (!name_2) return [3 /*break*/, 5];
                    return [4 /*yield*/, findOrCreateContact({ type: 'customer', name: name_2 })];
                case 4:
                    id = _d.sent();
                    if (id)
                        contactMap["customer:".concat(name_2)] = id;
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    _a = 0, purchases_1 = purchases;
                    _d.label = 7;
                case 7:
                    if (!(_a < purchases_1.length)) return [3 /*break*/, 10];
                    purchase = purchases_1[_a];
                    name_3 = String(purchase.supplier || purchase.supplier_name || purchase.vendor || purchase.name || 'Unknown Supplier').trim();
                    if (!name_3) return [3 /*break*/, 9];
                    return [4 /*yield*/, findOrCreateContact({ type: 'supplier', name: name_3 })];
                case 8:
                    id = _d.sent();
                    if (id)
                        contactMap["supplier:".concat(name_3)] = id;
                    _d.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10:
                    _b = 0, products_1 = products;
                    _d.label = 11;
                case 11:
                    if (!(_b < products_1.length)) return [3 /*break*/, 14];
                    product = products_1[_b];
                    return [4 /*yield*/, findOrCreateProduct(product)];
                case 12:
                    _d.sent();
                    _d.label = 13;
                case 13:
                    _b++;
                    return [3 /*break*/, 11];
                case 14:
                    _c = 0, staff_1 = staff;
                    _d.label = 15;
                case 15:
                    if (!(_c < staff_1.length)) return [3 /*break*/, 18];
                    staffRow = staff_1[_c];
                    return [4 /*yield*/, findOrCreateStaff(staffRow)];
                case 16:
                    _d.sent();
                    _d.label = 17;
                case 17:
                    _c++;
                    return [3 /*break*/, 15];
                case 18: return [4 /*yield*/, insertSaleRecords(sales, contactMap)];
                case 19:
                    _d.sent();
                    return [4 /*yield*/, insertPurchaseRecords(purchases, contactMap)];
                case 20:
                    _d.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true })];
                case 21:
                    error_1 = _d.sent();
                    message = formatErrorMessage(error_1);
                    return [2 /*return*/, server_1.NextResponse.json({ success: false, error: message }, { status: 500 })];
                case 22: return [2 /*return*/];
            }
        });
    });
}
