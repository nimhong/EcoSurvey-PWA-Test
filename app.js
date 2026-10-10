/* ========================================
   EcoSurvey V1
   野外动物调查记录器
   ======================================== */


/* ========================================
   1. 数据
   ======================================== */

const STORAGE_KEY = "EcoSurveyData";


let data = {

    schema_version: "1.0",

    app: {

        name: "EcoSurvey",

        version: "1.0.0"

    },

    meta: {

        created_at:
            new Date().toISOString(),

        updated_at:
            new Date().toISOString()

    },

    transects: [],

    events: [],

    reserved_event_ids: [],

    rescue_operations: [],

    rescue_events: [],

    reserved_rescue_operation_ids: [],

    reserved_rescue_event_ids: []

};


let currentTransectId = null;
let editingTransectId = null;
let editingEventId = null;


/* ========================================
   2. 页面元素
   ======================================== */

const currentTransectEl =
    document.getElementById(
        "currentTransect"
    );


const transectFormSection =
    document.getElementById(
        "transectFormSection"
    );


const eventSection =
    document.getElementById(
        "eventSection"
    );


const eventFormSection =
    document.getElementById(
        "eventFormSection"
    );


const recentEventsSection =
    document.getElementById(
        "recentEventsSection"
    );


const recentEventsEl =
    document.getElementById(
        "recentEvents"
    );


const dataStatusEl =
    document.getElementById(
        "dataStatus"
    );


const eventMessageEl =
    document.getElementById(
        "eventMessage"
    );


/* ========================================
   3. 初始化
   ======================================== */

loadData();

renderAll();


/* ========================================
   4. 读取数据
   ======================================== */

function loadData() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        return;

    }


    try {

        const parsed =
            JSON.parse(saved);


        if (
            parsed &&
            typeof parsed === "object"
        ) {

            data = parsed;

            data.transects = Array.isArray(data.transects) ? data.transects : [];
            data.events = Array.isArray(data.events) ? data.events : [];
            data.reserved_event_ids = Array.isArray(data.reserved_event_ids) ? data.reserved_event_ids : [];
            data.rescue_operations = Array.isArray(data.rescue_operations) ? data.rescue_operations : [];
            data.rescue_events = Array.isArray(data.rescue_events) ? data.rescue_events : [];
            data.reserved_rescue_operation_ids = Array.isArray(data.reserved_rescue_operation_ids) ? data.reserved_rescue_operation_ids : [];
            data.reserved_rescue_event_ids = Array.isArray(data.reserved_rescue_event_ids) ? data.reserved_rescue_event_ids : [];

            data.rescue_operations.forEach(item => {
                if (!item.status) item.status = "active";
                if (item.operation_id && !data.reserved_rescue_operation_ids.includes(item.operation_id)) data.reserved_rescue_operation_ids.push(item.operation_id);
            });
            data.rescue_events.forEach(item => {
                if (!item.status) item.status = "active";
                if (item.event_id && !data.reserved_rescue_event_ids.includes(item.event_id)) data.reserved_rescue_event_ids.push(item.event_id);
            });

            data.transects.forEach(item => {
                if (!item.status) item.status = "active";
            });

            data.events.forEach(item => {
                if (!item.status) item.status = "active";
                if (item.event_id && !data.reserved_event_ids.includes(item.event_id)) {
                    data.reserved_event_ids.push(item.event_id);
                }
            });

        }

    } catch (error) {

        console.error(
            "读取本地数据失败：",
            error
        );

    }

}


/* ========================================
   5. 保存数据
   ======================================== */

function saveData() {

    data.meta.updated_at =
        new Date().toISOString();


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );


    renderAll();

}


/* ========================================
   6. 总体渲染
   ======================================== */

function renderAll() {

    renderCurrentTransect();

    renderRecentEvents();

    renderDataStatus();
    if (!document.getElementById("rescueManagementSection")?.classList.contains("hidden")) renderRescueManagement();
    if (!document.getElementById("rescueOperationDetailSection")?.classList.contains("hidden")) renderRescueOperationDetail();

}


/* ========================================
   7. 当前样线
   ======================================== */

function renderCurrentTransect() {

    const eventManagementBtn =
        document.getElementById("eventManagementBtn");

    if (!currentTransectId) {

        currentTransectEl.textContent =
            "暂无当前样线";

        if (eventManagementBtn) {
            eventManagementBtn.disabled = true;
        }


        eventSection.classList.add(
            "hidden"
        );


        recentEventsSection.classList.add(
            "hidden"
        );


        return;

    }


    const transect =
        data.transects.find(
            item =>
                item.transect_id ===
                currentTransectId &&
                item.status !== "deleted"
        );


    if (!transect) {

        currentTransectId =
            null;


        currentTransectEl.textContent =
            "暂无当前样线";

        if (eventManagementBtn) {
            eventManagementBtn.disabled = true;
        }


        eventSection.classList.add(
            "hidden"
        );


        recentEventsSection.classList.add(
            "hidden"
        );


        return;

    }


    if (eventManagementBtn) {
        eventManagementBtn.disabled = false;
    }


    currentTransectEl.innerHTML = `

        <div>
            ${escapeHtml(transect.transect_id)}
        </div>

        <div class="current-transect-actions">
            <button class="btn btn-secondary btn-small" onclick="viewTransect(\'${escapeHtml(transect.transect_id)}\')">查看</button>
            <button class="btn btn-secondary btn-small" onclick="editTransect(\'${escapeHtml(transect.transect_id)}\')">修改</button>
            <button class="btn btn-danger btn-small" onclick="softDeleteTransect(\'${escapeHtml(transect.transect_id)}\')">删除</button>
        </div>

    `;


    eventSection.classList.remove(
        "hidden"
    );


    recentEventsSection.classList.remove(
        "hidden"
    );

}


/* ========================================
   8. 最近事件
   ======================================== */

function renderRecentEvents() {

    if (!currentTransectId) {

        recentEventsEl.innerHTML =
            "";

        return;

    }


    const events =
        data.events

            .filter(
                event =>
                    event.transect_id ===
                    currentTransectId &&
                    event.status !== "deleted"
            )

            .slice()

            .reverse()

            .slice(
                0,
                10
            );


    if (events.length === 0) {

        recentEventsEl.innerHTML = `

            <div class="event-item">

                <div class="event-detail">
                    当前样线还没有调查事件。
                </div>

            </div>

        `;

        return;

    }


    recentEventsEl.innerHTML =
        events

            .map(
                event => `

                    <div class="event-item">

                        <div class="event-id">

                            ${escapeHtml(
                                event.event_id
                            )}

                        </div>


                        <div class="event-main">

                            ${escapeHtml(
                                event.subject
                            )}

                            ·

                            ${escapeHtml(
                                String(
                                    event.total_count
                                )
                            )}

                            个体

                        </div>


                        <div class="event-detail">

                            行为：

                            ${escapeHtml(
                                event.behavior.join(
                                    "、"
                                )
                            )}

                            <br>

                            证据：

                            ${escapeHtml(
                                event.evidence.join(
                                    "、"
                                )
                            )}

                        </div>

                    </div>

                `
            )

            .join("");

}


/* ========================================
   9. 数据状态
   ======================================== */

function renderDataStatus() {

    const transectCount = data.transects.length;
    const activeTransectCount = data.transects.filter(item => item.status !== "deleted").length;
    const deletedTransectCount = data.transects.filter(item => item.status === "deleted").length;
    const eventCount = data.events.length;
    const activeEventCount = data.events.filter(item => item.status !== "deleted").length;
    const deletedEventCount = data.events.filter(item => item.status === "deleted").length;


    dataStatusEl.innerHTML = `

        样线：${transectCount} 条（有效 ${activeTransectCount}，已删除 ${deletedTransectCount}）
        <br>
        调查事件：${eventCount} 条（有效 ${activeEventCount}，已删除 ${deletedEventCount}）
        <br>
        搜救作业：${data.rescue_operations.length} 条（有效 ${data.rescue_operations.filter(item => item.status !== "deleted").length}，已删除 ${data.rescue_operations.filter(item => item.status === "deleted").length}）
        <br>
        搜救事件：${data.rescue_events.length} 条（有效 ${data.rescue_events.filter(item => item.status !== "deleted").length}，已删除 ${data.rescue_events.filter(item => item.status === "deleted").length}）

        <br>

        数据保存位置：
        本机浏览器 localStorage

    `;

}


/* ========================================
   10. 新建样线
   ======================================== */

document
    .getElementById(
        "newTransectBtn"
    )
    .addEventListener(
        "click",
        () => {

            editingTransectId = null;
            document.querySelector("#transectFormSection .section-title").textContent = "新建样线";
            document.getElementById("transectId").disabled = false;
            clearTransectForm();

            transectFormSection.classList.remove(
                "hidden"
            );


            eventFormSection.classList.add(
                "hidden"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


/* ========================================
   11. 保存样线
   ======================================== */

document
    .getElementById(
        "saveTransectBtn"
    )
    .addEventListener(
        "click",
        createOrUpdateTransect
    );


function createOrUpdateTransect() {

    const transectId =
        document
            .getElementById(
                "transectId"
            )
            .value
            .trim();


    const observer =
        document
            .getElementById(
                "observer"
            )
            .value
            .trim();


    const identifier =
        document
            .getElementById(
                "identifier"
            )
            .value
            .trim();


    const recorder =
        document
            .getElementById(
                "recorder"
            )
            .value
            .trim();


    const weather =
        document
            .getElementById(
                "weather"
            )
            .value;


    const temperature =
        document
            .getElementById(
                "temperature"
            )
            .value
            .trim();


    const waterTemperature =
        document
            .getElementById(
                "waterTemperature"
            )
            .value
            .trim();


    const humidity =
        document
            .getElementById(
                "humidity"
            )
            .value
            .trim();


    const ph =
        document
            .getElementById(
                "ph"
            )
            .value
            .trim();


    const mainHabitat =
        document
            .getElementById(
                "mainHabitat"
            )
            .value;


    const disturbanceType =
        document
            .getElementById(
                "disturbanceType"
            )
            .value;


    const disturbanceLevel =
        document
            .getElementById(
                "disturbanceLevel"
            )
            .value;


    const remark =
        document
            .getElementById(
                "transectRemark"
            )
            .value
            .trim();


    /* ========================================
       必填检查
       ======================================== */

    if (!transectId) {

        alert(
            "请输入样线编号。"
        );

        return;

    }


    if (!observer) {

        alert(
            "请输入观测者。"
        );

        return;

    }


    if (!identifier) {

        alert(
            "请输入鉴定者。"
        );

        return;

    }


    if (!recorder) {

        alert(
            "请输入记录者。"
        );

        return;

    }


    if (!weather) {

        alert(
            "请选择天气。"
        );

        return;

    }


    if (!temperature) {

        alert(
            "请输入温度。"
        );

        return;

    }


    if (!mainHabitat) {

        alert(
            "请选择主要生境。"
        );

        return;

    }


    if (!disturbanceType) {

        alert(
            "请选择人为干扰类型。"
        );

        return;

    }


    if (!disturbanceLevel) {

        alert(
            "请选择人为干扰程度。"
        );

        return;

    }


    /* ========================================
       检查编号重复
       ======================================== */

    const existing = data.transects.find(item => item.transect_id === transectId);

    if (editingTransectId) {
        const transect = data.transects.find(item => item.transect_id === editingTransectId);
        if (!transect) return;
        if (transect.status === "deleted") { alert("已删除样线不能直接修改，请先恢复。"); return; }
        const hasEvents = data.events.some(event => event.transect_id === editingTransectId);
        if (transectId !== editingTransectId && hasEvents) {
            alert("该样线已有调查事件，样线编号不能修改。请在样线备注中记录正确编号。");
            return;
        }
        if (transectId !== editingTransectId && existing) {
            alert("这个样线编号已经存在，请使用其他编号。");
            return;
        }
        const oldId = transect.transect_id;
        Object.assign(transect, { transect_id: transectId, observer, identifier, recorder, weather, temperature, water_temperature: waterTemperature, humidity, ph, main_habitat: mainHabitat, disturbance_type: disturbanceType, disturbance_level: disturbanceLevel, remark });
        if (oldId !== transectId) {
            data.events.forEach(event => { if (event.transect_id === oldId) event.transect_id = transectId; });
            if (currentTransectId === oldId) currentTransectId = transectId;
        }
        editingTransectId = null;
        saveData();
        transectFormSection.classList.add("hidden");
        clearTransectForm();
        copyToClipboard(generateTransectText(transect));
        alert(`已修改 ${transectId}，样线标准化记录已复制。请手动更新两步路中对应样线起点标记的备注。`);
        openTransectManagement();
        return;
    }

    if (existing) {
        alert("这个样线编号已经存在，请使用其他编号。");
        return;
    }


    /* ========================================
       创建样线
       ======================================== */

    const transect = {

        transect_id:
            transectId,

        status:
            "active",

        observer:
            observer,

        identifier:
            identifier,

        recorder:
            recorder,

        weather:
            weather,

        temperature:
            temperature,

        water_temperature:
            waterTemperature,

        humidity:
            humidity,

        ph:
            ph,

        main_habitat:
            mainHabitat,

        disturbance_type:
            disturbanceType,

        disturbance_level:
            disturbanceLevel,

        remark:
            remark,


        /* -------------------------------
           两步路后续解析
           ------------------------------- */

        start: {

            longitude: null,

            latitude: null,

            altitude: null,

            time: null

        },


        end: {

            longitude: null,

            latitude: null,

            altitude: null,

            time: null

        },


        length:
            null

    };


    data.transects.push(
        transect
    );


    currentTransectId =
        transectId;


    saveData();


    transectFormSection.classList.add(
        "hidden"
    );


    clearTransectForm();


    alert(
        "样线保存成功。"
    );

}


/* ========================================
   12. 取消样线
   ======================================== */

document
    .getElementById(
        "cancelTransectBtn"
    )
    .addEventListener(
        "click",
        () => {

            transectFormSection.classList.add(
                "hidden"
            );

        }
    );


/* ========================================
   13. 清空样线
   ======================================== */

function clearTransectForm() {

    document
        .getElementById(
            "transectId"
        )
        .value = "";


    document
        .getElementById(
            "observer"
        )
        .value = "";


    document
        .getElementById(
            "identifier"
        )
        .value = "";


    document
        .getElementById(
            "recorder"
        )
        .value = "";


    document
        .getElementById(
            "weather"
        )
        .value = "";


    document
        .getElementById(
            "temperature"
        )
        .value = "";


    document
        .getElementById(
            "waterTemperature"
        )
        .value = "";


    document
        .getElementById(
            "humidity"
        )
        .value = "";


    document
        .getElementById(
            "ph"
        )
        .value = "";


    document
        .getElementById(
            "mainHabitat"
        )
        .value = "";


    document
        .getElementById(
            "disturbanceType"
        )
        .value = "";


    document
        .getElementById(
            "disturbanceLevel"
        )
        .value = "";


    document
        .getElementById(
            "transectRemark"
        )
        .value = "";

}


/* ========================================
   14. 新建调查事件
   ======================================== */

document
    .getElementById(
        "newEventBtn"
    )
    .addEventListener(
        "click",
        () => {

            editingEventId = null;
            document.querySelector("#eventFormSection .section-title").textContent = "新建调查事件";

            if (!currentTransectId) {

                alert(
                    "请先建立当前样线。"
                );

                return;

            }


            eventFormSection.classList.remove(
                "hidden"
            );


            eventMessageEl.textContent =
                "";


            clearEventForm();


            eventFormSection.scrollIntoView({
                behavior: "smooth"
            });

        }
    );


/* ========================================
   15. 保存并复制事件
   ======================================== */

document
    .getElementById(
        "saveEventBtn"
    )
    .addEventListener(
        "click",
        createOrUpdateEvent
    );


function createOrUpdateEvent() {

    if (!currentTransectId) {

        alert(
            "当前没有样线。"
        );

        return;

    }


    /* ========================================
       基础字段
       ======================================== */

    const subject =
        document
            .getElementById(
                "subject"
            )
            .value
            .trim();


    const totalCount =
        document
            .getElementById(
                "totalCount"
            )
            .value
            .trim();


    const distance =
        document
            .getElementById(
                "distance"
            )
            .value
            .trim();


    const localHabitat =
        document
            .getElementById(
                "localHabitat"
            )
            .value;


    /* ========================================
       行为
       ======================================== */

    const behavior =
        Array.from(
            document.querySelectorAll(
                'input[name="behavior"]:checked'
            )
        )
        .map(
            input =>
                input.value
        );


    /* ========================================
       证据
       ======================================== */

    const evidence =
        Array.from(
            document.querySelectorAll(
                'input[name="evidence"]:checked'
            )
        )
        .map(
            input =>
                input.value
        );


    /* ========================================
       鉴定状态
       ======================================== */

    const identification =
        document.querySelector(
            'input[name="identificationStatus"]:checked'
        );


    const identificationStatus =
        identification
            ? identification.value
            : "";


    /* ========================================
       更多信息
       ======================================== */

    const female =
        document
            .getElementById(
                "female"
            )
            .value
            .trim();


    const male =
        document
            .getElementById(
                "male"
            )
            .value
            .trim();


    const juvenile =
        document
            .getElementById(
                "juvenile"
            )
            .value
            .trim();


    const adult =
        document
            .getElementById(
                "adult"
            )
            .value
            .trim();


    const subadult =
        document
            .getElementById(
                "subadult"
            )
            .value
            .trim();


    const tadpole =
        document
            .getElementById(
                "tadpole"
            )
            .value
            .trim();


    const eggMass =
        document
            .getElementById(
                "eggMass"
            )
            .value
            .trim();


    const remark =
        document
            .getElementById(
                "eventRemark"
            )
            .value
            .trim();


    /* ========================================
       必填检查
       ======================================== */

    if (!subject) {

        alert(
            "请输入调查对象。"
        );

        return;

    }


    if (!totalCount) {

        alert(
            "请输入个体总数。"
        );

        return;

    }


    if (!distance) {

        alert(
            "请输入截距。"
        );

        return;

    }


    if (!localHabitat) {

        alert(
            "请选择局部生境。"
        );

        return;

    }


    if (behavior.length === 0) {

        alert(
            "请选择行为。"
        );

        return;

    }


    if (evidence.length === 0) {

        alert(
            "请选择证据类型。"
        );

        return;

    }


    if (!identificationStatus) {

        alert(
            "请选择鉴定状态。"
        );

        return;

    }


    /* ========================================
       修改已有事件
       ======================================== */

    if (editingEventId) {
        const event = data.events.find(item => item.event_id === editingEventId);
        if (!event) return;
        if (event.status === "deleted") {
            alert("已删除事件不能直接修改。");
            return;
        }

        Object.assign(event, {
            subject, total_count: totalCount, distance, local_habitat: localHabitat,
            behavior, evidence, identification_status: identificationStatus,
            female, male, juvenile, remark,
            amphibian: { adult, subadult, tadpole, egg_mass: eggMass }
        });

        const eventId = event.event_id;
        editingEventId = null;
        saveData();
        clearEventForm();
        eventFormSection.classList.add("hidden");
        copyToClipboard(generateEventText(event));
        alert(`已修改 ${eventId}，更新后的标准化记录已复制到剪贴板。请手动更新两步路中对应标记的备注。`);
        renderTransectManagement();
        return;
    }


    /* ========================================
       事件ID
       ======================================== */

    const eventId =
        generateNextEventId(
            currentTransectId
        );


    /* ========================================
       创建事件
       ======================================== */

    const event = {

        event_id:
            eventId,

        status:
            "active",

        transect_id:
            currentTransectId,


        /* 两步路后续解析 */

        survey_time:
            null,

        longitude:
            null,

        latitude:
            null,

        altitude:
            null,

        attachments:
            [],


        /* 原始两步路记录 */

        raw_record:
            "",


        /* 人工填写 */

        subject:
            subject,

        total_count:
            totalCount,

        distance:
            distance,

        local_habitat:
            localHabitat,

        behavior:
            behavior,

        evidence:
            evidence,

        identification_status:
            identificationStatus,


        /* 性别/年龄 */

        female:
            female,

        male:
            male,

        juvenile:
            juvenile,


        /* 两栖类扩展 */

        amphibian: {

            adult:
                adult,

            subadult:
                subadult,

            tadpole:
                tadpole,

            egg_mass:
                eggMass

        },


        remark:
            remark

    };


    /* ========================================
       保存
       ======================================== */

    data.events.push(
        event
    );


    saveData();


    /* ========================================
       生成标准化文本
       ======================================== */

    const standardText =
        generateEventText(
            event
        );


    /* ========================================
       复制
       ======================================== */

    copyToClipboard(
        standardText
    );


    /* ========================================
       清空表单
       ======================================== */

    clearEventForm();


    /* ========================================
       关键修改：
       保存并复制后关闭输入窗口
       ======================================== */

    eventFormSection.classList.add(
        "hidden"
    );


    /* ========================================
       提示
       ======================================== */

    eventMessageEl.textContent =
        "";


    renderRecentEvents();


    alert(
        `已保存 ${eventId}，标准化记录已复制到剪贴板。`
    );

}


/* ========================================
   16. 生成事件ID
   ======================================== */

function generateNextEventId(transectId) {
    const prefix = `${transectId}_E`;
    const existingNumbers = data.reserved_event_ids
        .filter(id => id.startsWith(prefix))
        .map(id => { const match = id.match(/_E(\d+)$/); return match ? parseInt(match[1], 10) : 0; });
    let nextNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
    const eventId = prefix + String(nextNumber).padStart(3, "0");
    data.reserved_event_ids.push(eventId);
    return eventId;
}


/* ========================================
   17. 生成标准化文本
   ======================================== */

function generateEventText(
    event
) {

    let text = "";


    text +=
        "【调查事件】\n";


    text +=
        `事件=${event.event_id}\n`;


    text +=
        `样线=${event.transect_id}\n`;


    text +=
        `调查对象=${event.subject}\n`;


    text +=
        `个体总数=${event.total_count}\n`;


    text +=
        `截距=${event.distance}m\n`;


    text +=
        `局部生境=${event.local_habitat}\n`;


    text +=
        `行为=${event.behavior.join(",")}\n`;


    text +=
        `证据类型=${event.evidence.join(",")}\n`;


    text +=
        `鉴定状态=${event.identification_status}\n`;


    if (
        event.female !== ""
    ) {

        text +=
            `雌=${event.female}\n`;

    }


    if (
        event.male !== ""
    ) {

        text +=
            `雄=${event.male}\n`;

    }


    if (
        event.juvenile !== ""
    ) {

        text +=
            `幼体=${event.juvenile}\n`;

    }


    const amphibian =
        event.amphibian;


    if (
        amphibian &&
        amphibian.adult !== ""
    ) {

        text +=
            `成体=${amphibian.adult}\n`;

    }


    if (
        amphibian &&
        amphibian.subadult !== ""
    ) {

        text +=
            `亚成体=${amphibian.subadult}\n`;

    }


    if (
        amphibian &&
        amphibian.tadpole !== ""
    ) {

        text +=
            `蝌蚪=${amphibian.tadpole}\n`;

    }


    if (
        amphibian &&
        amphibian.egg_mass !== ""
    ) {

        text +=
            `卵块数量=${amphibian.egg_mass}\n`;

    }


    if (
        event.remark !== ""
    ) {

        text +=
            `备注=${event.remark}\n`;

    }


    return text;

}


/* ========================================
   18. 复制
   ======================================== */

async function copyToClipboard(
    text
) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    } catch (error) {

        console.error(
            "复制失败：",
            error
        );


        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.style.position =
            "fixed";


        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

        } catch (copyError) {

            console.error(
                "备用复制方式失败：",
                copyError
            );

        }


        document.body.removeChild(
            textarea
        );

    }

}


/* ========================================
   19. 清空事件表单
   ======================================== */

function clearEventForm() {

    document
        .getElementById(
            "subject"
        )
        .value = "";


    document
        .getElementById(
            "totalCount"
        )
        .value = "";


    document
        .getElementById(
            "distance"
        )
        .value = "";


    document
        .getElementById(
            "localHabitat"
        )
        .value = "";


    document
        .querySelectorAll(
            'input[name="behavior"]'
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;

            }
        );


    document
        .querySelectorAll(
            'input[name="evidence"]'
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;

            }
        );


    document
        .querySelectorAll(
            'input[name="identificationStatus"]'
        )
        .forEach(
            radio => {

                radio.checked =
                    false;

            }
        );


    document
        .getElementById(
            "female"
        )
        .value = "";


    document
        .getElementById(
            "male"
        )
        .value = "";


    document
        .getElementById(
            "juvenile"
        )
        .value = "";


    document
        .getElementById(
            "adult"
        )
        .value = "";


    document
        .getElementById(
            "subadult"
        )
        .value = "";


    document
        .getElementById(
            "tadpole"
        )
        .value = "";


    document
        .getElementById(
            "eggMass"
        )
        .value = "";


    document
        .getElementById(
            "eventRemark"
        )
        .value = "";


    eventMessageEl.textContent =
        "";

}


/* ========================================
   20. 取消调查事件
   ======================================== */

document
    .getElementById(
        "cancelEventBtn"
    )
    .addEventListener(
        "click",
        () => {

            editingEventId = null;
            document.querySelector("#eventFormSection .section-title").textContent = "新建调查事件";
            eventFormSection.classList.add(
                "hidden"
            );


            clearEventForm();

        }
    );


/* ========================================
   21. HTML安全转义
   ======================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}

/* ========================================
   22. 样线管理中心
   ======================================== */

function openCurrentEventManagement() {
    if (!currentTransectId) {
        alert("当前没有样线，无法管理调查事件。");
        return;
    }

    const transect = data.transects.find(
        item => item.transect_id === currentTransectId
    );

    if (!transect || transect.status === "deleted") {
        alert("当前样线不可管理事件，请先恢复样线。");
        return;
    }

    // 直接打开当前样线详情，其中包含该样线全部事件的管理操作。
    viewTransect(currentTransectId);
}

function openTransectManagement() {
    renderTransectManagement();
    document.getElementById("transectManagementSection").classList.remove("hidden");
    document.getElementById("transectManagementSection").scrollIntoView({ behavior: "smooth" });
}

function closeTransectManagement() {
    document.getElementById("transectManagementSection").classList.add("hidden");
}

function renderTransectManagement() {
    const el = document.getElementById("transectManagementList");
    if (!el) return;
    if (!data.transects.length) { el.innerHTML = '<div class="empty-state">暂无样线记录。</div>'; return; }
    el.innerHTML = data.transects.map(transect => {
        const count = data.events.filter(event => event.transect_id === transect.transect_id).length;
        const deleted = transect.status === "deleted";
        return `<div class="management-item ${deleted ? "is-deleted" : ""}">
            <div class="management-main">
                <div class="management-title">${escapeHtml(transect.transect_id)}</div>
                <div class="management-meta">调查事件：${count} 条 · 状态：<span class="status-badge ${deleted ? "status-deleted" : "status-active"}">${deleted ? "已删除" : "有效"}</span></div>
            </div>
            <div class="management-actions">
                <button class="btn btn-secondary btn-small" onclick="viewTransect('${escapeHtml(transect.transect_id)}')">查看</button>
                ${deleted ? `<button class="btn btn-secondary btn-small" onclick="restoreTransect('${escapeHtml(transect.transect_id)}')">恢复</button><button class="btn btn-danger btn-small permanent-action" onclick="permanentlyDeleteTransect('${escapeHtml(transect.transect_id)}')">彻底删除</button>` : `<button class="btn btn-secondary btn-small" onclick="setCurrentTransect('${escapeHtml(transect.transect_id)}')">设为当前</button><button class="btn btn-secondary btn-small" onclick="editTransect('${escapeHtml(transect.transect_id)}')">修改</button><button class="btn btn-danger btn-small" onclick="softDeleteTransect('${escapeHtml(transect.transect_id)}')">删除</button>`}
            </div>
        </div>`;
    }).join("");
}

function viewTransect(id) {
    const t = data.transects.find(item => item.transect_id === id);
    if (!t) return;
    const events = data.events.filter(event => event.transect_id === id);
    document.getElementById("viewModalTitle").textContent = `样线：${id}`;
    document.getElementById("viewModalBody").innerHTML = `
        <div class="detail-list">
            <div><span>状态</span>${t.status === "deleted" ? "已删除" : "有效"}</div>
            <div><span>观测者</span>${escapeHtml(t.observer)}</div>
            <div><span>鉴定者</span>${escapeHtml(t.identifier)}</div>
            <div><span>记录者</span>${escapeHtml(t.recorder)}</div>
            <div><span>天气</span>${escapeHtml(t.weather)}</div>
            <div><span>温度</span>${escapeHtml(t.temperature)}</div>
            <div><span>主要生境</span>${escapeHtml(t.main_habitat)}</div>
            <div><span>人为干扰</span>${escapeHtml(t.disturbance_type)} / ${escapeHtml(t.disturbance_level)}</div>
            <div><span>样线长度</span>${escapeHtml(t.length ?? "")}</div>
            <div><span>调查事件</span>${events.length} 条</div>
            <div><span>备注</span>${escapeHtml(t.remark)}</div>
        </div>
        <div class="modal-subtitle">调查事件</div>
        <div class="event-management-list">
            ${events.length ? events.map(event => `
                <div class="event-management-item ${event.status === "deleted" ? "is-deleted" : ""}">
                    <div>
                        <strong>${escapeHtml(event.event_id)}</strong> · ${escapeHtml(event.subject)} · ${escapeHtml(event.total_count)} 个体
                        <div class="event-management-meta">状态：${event.status === "deleted" ? "已删除" : "有效"}</div>
                    </div>
                    <div class="management-actions">
                        <button class="btn btn-secondary btn-small" onclick="viewEvent('${escapeHtml(event.event_id)}')">查看</button>
                        ${event.status === "deleted" ? `<button class="btn btn-secondary btn-small" onclick="restoreEvent('${escapeHtml(event.event_id)}')">恢复</button>` : `<button class="btn btn-secondary btn-small" onclick="editEvent('${escapeHtml(event.event_id)}')">修改</button><button class="btn btn-danger btn-small" onclick="softDeleteEvent('${escapeHtml(event.event_id)}')">删除</button>`}
                    </div>
                </div>`).join("") : '<div class="empty-state">该样线暂无调查事件。</div>'}
        </div>`;
    document.getElementById("viewModal").classList.remove("hidden");
}

function closeViewModal() { document.getElementById("viewModal").classList.add("hidden"); }

function editTransect(id) {
    const t = data.transects.find(item => item.transect_id === id);
    if (!t) return;
    if (t.status === "deleted") { alert("该样线已删除，不能直接修改。请先恢复样线。"); return; }
    editingTransectId = id;
    document.getElementById("transectFormSection").classList.remove("hidden");
    document.querySelector("#transectFormSection .section-title").textContent = "修改样线";
    fillTransectForm(t);
    const hasEvents = data.events.some(event => event.transect_id === id);
    document.getElementById("transectId").disabled = hasEvents;
    document.getElementById("transectId").title = hasEvents ? "该样线已有调查事件，编号不可修改" : "";
    document.getElementById("transectFormSection").scrollIntoView({ behavior: "smooth" });
}

function fillTransectForm(t) {
    const map = { transectId:"transect_id", observer:"observer", identifier:"identifier", recorder:"recorder", weather:"weather", temperature:"temperature", waterTemperature:"water_temperature", humidity:"humidity", ph:"ph", mainHabitat:"main_habitat", disturbanceType:"disturbance_type", disturbanceLevel:"disturbance_level", transectRemark:"remark" };
    Object.entries(map).forEach(([id,key]) => { document.getElementById(id).value = t[key] ?? ""; });
}

function softDeleteTransect(id) {
    const t = data.transects.find(item => item.transect_id === id);
    if (!t || t.status === "deleted") return;
    if (!confirm(`样线：${id}\n将进入“已删除”状态，可之后恢复。\n是否确认删除？`)) return;
    t.status = "deleted";
    t.deleted_at = new Date().toISOString();
    data.events.forEach(event => {
        if (event.transect_id === id && event.status !== "deleted") {
            event.status = "deleted";
            event.deleted_at = new Date().toISOString();
            event.deleted_reason = "transect_deleted";
        }
    });
    if (currentTransectId === id) currentTransectId = null;
    saveData();
    renderTransectManagement();
}

function setCurrentTransect(id) {
    const t = data.transects.find(item => item.transect_id === id);
    if (!t || t.status === "deleted") {
        alert("已删除样线不能设为当前样线，请先恢复。");
        return;
    }
    currentTransectId = id;
    eventFormSection.classList.add("hidden");
    editingEventId = null;
    document.querySelector("#eventFormSection .section-title").textContent = "新建调查事件";
    clearEventForm();
    renderAll();
    alert(`当前样线已切换为：${id}`);
}

function restoreTransect(id) {
    const t = data.transects.find(item => item.transect_id === id);
    if (!t || t.status !== "deleted") return;
    t.status = "active";
    t.restored_at = new Date().toISOString();
    data.events.forEach(event => {
        if (event.transect_id === id && event.status === "deleted" && event.deleted_reason === "transect_deleted") {
            event.status = "active";
            delete event.deleted_at;
            delete event.deleted_reason;
        }
    });
    saveData();
    renderTransectManagement();
    alert(`样线：${id} 已恢复。`);
}

function permanentlyDeleteTransect(id) {
    const t = data.transects.find(item => item.transect_id === id);
    if (!t || t.status !== "deleted") return;
    const count = data.events.filter(event => event.transect_id === id).length;
    if (!confirm(`样线：${id}  调查事件：${count} 条  将彻底删除，是否确认。`)) return;
    if (!confirm("此操作将无法恢复。")) return;
    data.transects = data.transects.filter(item => item.transect_id !== id);
    data.events = data.events.filter(event => event.transect_id !== id);
    if (currentTransectId === id) currentTransectId = null;
    saveData();
    renderTransectManagement();
    alert(`样线：${id} 已彻底删除。`);
}

document.getElementById("eventManagementBtn")?.addEventListener("click", openCurrentEventManagement);
document.getElementById("transectManagementBtn")?.addEventListener("click", openTransectManagement);
document.getElementById("closeTransectManagementBtn")?.addEventListener("click", closeTransectManagement);
document.getElementById("closeViewModalBtn")?.addEventListener("click", closeViewModal);

/* 修改取消时恢复标题和编号状态 */
document.getElementById("cancelTransectBtn").addEventListener("click", () => {
    editingTransectId = null;
    document.querySelector("#transectFormSection .section-title").textContent = "新建样线";
    document.getElementById("transectId").disabled = false;
    clearTransectForm();
});

function generateTransectText(transect) {
    let text = "【样线记录】\n";
    text += `样线=${transect.transect_id}\n`;
    text += `观测者=${transect.observer}\n`;
    text += `鉴定者=${transect.identifier}\n`;
    text += `记录者=${transect.recorder}\n`;
    text += `天气=${transect.weather}\n`;
    text += `温度=${transect.temperature}\n`;
    if (transect.water_temperature) text += `水温=${transect.water_temperature}\n`;
    if (transect.humidity) text += `湿度=${transect.humidity}\n`;
    if (transect.ph) text += `pH=${transect.ph}\n`;
    text += `主要生境=${transect.main_habitat}\n`;
    text += `人为干扰类型=${transect.disturbance_type}\n`;
    text += `人为干扰程度=${transect.disturbance_level}\n`;
    if (transect.remark) text += `备注=${transect.remark}\n`;
    return text;
}

function viewEvent(eventId) {
    const event = data.events.find(item => item.event_id === eventId);
    if (!event) return;
    document.getElementById("viewModalTitle").textContent = `调查事件：${eventId}`;
    document.getElementById("viewModalBody").innerHTML = `
        <div class="detail-list">
            <div><span>状态</span>${event.status === "deleted" ? "已删除" : "有效"}</div>
            <div><span>样线</span>${escapeHtml(event.transect_id)}</div>
            <div><span>调查对象</span>${escapeHtml(event.subject)}</div>
            <div><span>个体总数</span>${escapeHtml(event.total_count)}</div>
            <div><span>截距</span>${escapeHtml(event.distance)} m</div>
            <div><span>局部生境</span>${escapeHtml(event.local_habitat)}</div>
            <div><span>行为</span>${escapeHtml((event.behavior || []).join("、"))}</div>
            <div><span>证据类型</span>${escapeHtml((event.evidence || []).join("、"))}</div>
            <div><span>鉴定状态</span>${escapeHtml(event.identification_status)}</div>
            <div><span>雌 / 雄 / 幼体</span>${escapeHtml(event.female)} / ${escapeHtml(event.male)} / ${escapeHtml(event.juvenile)}</div>
            <div><span>备注</span>${escapeHtml(event.remark)}</div>
        </div>`;
    document.getElementById("viewModal").classList.remove("hidden");
}

function editEvent(eventId) {
    const event = data.events.find(item => item.event_id === eventId);
    if (!event) return;
    if (event.status === "deleted") { alert("已删除事件不能直接修改。"); return; }
    const transect = data.transects.find(item => item.transect_id === event.transect_id);
    if (!transect || transect.status === "deleted") { alert("该事件所属样线已删除，请先恢复样线。"); return; }
    editingEventId = eventId;
    currentTransectId = event.transect_id;
    document.getElementById("eventFormSection").classList.remove("hidden");
    document.querySelector("#eventFormSection .section-title").textContent = "修改调查事件";
    fillEventForm(event);
    closeViewModal();
    document.getElementById("eventFormSection").scrollIntoView({ behavior: "smooth" });
}

function fillEventForm(event) {
    document.getElementById("subject").value = event.subject ?? "";
    document.getElementById("totalCount").value = event.total_count ?? "";
    document.getElementById("distance").value = event.distance ?? "";
    document.getElementById("localHabitat").value = event.local_habitat ?? "";
    document.querySelectorAll('input[name="behavior"]').forEach(input => input.checked = (event.behavior || []).includes(input.value));
    document.querySelectorAll('input[name="evidence"]').forEach(input => input.checked = (event.evidence || []).includes(input.value));
    document.querySelectorAll('input[name="identificationStatus"]').forEach(input => input.checked = input.value === event.identification_status);
    document.getElementById("female").value = event.female ?? "";
    document.getElementById("male").value = event.male ?? "";
    document.getElementById("juvenile").value = event.juvenile ?? "";
    document.getElementById("adult").value = event.amphibian?.adult ?? "";
    document.getElementById("subadult").value = event.amphibian?.subadult ?? "";
    document.getElementById("tadpole").value = event.amphibian?.tadpole ?? "";
    document.getElementById("eggMass").value = event.amphibian?.egg_mass ?? "";
    document.getElementById("eventRemark").value = event.remark ?? "";
}

function softDeleteEvent(eventId) {
    const event = data.events.find(item => item.event_id === eventId);
    if (!event || event.status === "deleted") return;
    if (!confirm(`调查事件：${eventId}\n将进入“已删除”状态。\n是否确认删除？`)) return;
    event.status = "deleted";
    event.deleted_at = new Date().toISOString();
    event.deleted_reason = "manual_delete";
    if (editingEventId === eventId) editingEventId = null;
    saveData();
    const transect = data.transects.find(item => item.transect_id === event.transect_id);
    if (transect) viewTransect(transect.transect_id);
    renderTransectManagement();
}

function restoreEvent(eventId) {
    const event = data.events.find(item => item.event_id === eventId);
    if (!event || event.status !== "deleted") return;

    const transect = data.transects.find(item => item.transect_id === event.transect_id);
    if (!transect) {
        alert("该事件所属样线不存在，无法恢复事件。");
        return;
    }

    if (transect.status === "deleted") {
        alert("该事件所属样线目前处于“已删除”状态，请先恢复样线，再恢复事件。");
        return;
    }

    if (!confirm(`调查事件：${eventId}\n将恢复为“有效”状态。\n是否确认恢复？`)) return;

    event.status = "active";
    delete event.deleted_at;
    delete event.deleted_reason;
    event.restored_at = new Date().toISOString();

    saveData();
    viewTransect(transect.transect_id);
    renderTransectManagement();
    alert(`调查事件：${eventId} 已恢复。`);
}

/* ========================================
   23. 当前样线管理入口初始化
   ======================================== */

renderTransectManagement();


/* ========================================
   野生动物搜救模块
   ======================================== */

const RESCUE_HABITATS = ["针叶林","针阔混交林","落叶阔叶林","常绿阔叶林","灌丛","草地","草坡","农田","果园","河流","湖泊","湿地/沼泽","裸地","裸岩","居民区","其他"];
let editingRescueOperationId = null;
let editingRescueEventId = null;
let currentRescueOperationId = null;
let selectedRescueProtection = "";
let selectedRescueHandling = "";

function initRescueModule() {
    const fill = id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<option value="">请选择</option>' + RESCUE_HABITATS.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
    };
    fill("rescueMainHabitat"); fill("rescueHabitat");
    document.querySelectorAll("#rescueProtectionLevel .choice-btn").forEach(btn => btn.addEventListener("click", () => selectRescueChoice("protection", btn.dataset.value)));
    document.querySelectorAll("#rescueHandlingMethod .choice-btn").forEach(btn => btn.addEventListener("click", () => selectRescueChoice("handling", btn.dataset.value)));
    document.getElementById("newRescueOperationBtn")?.addEventListener("click", openNewRescueOperation);
    document.getElementById("saveRescueOperationBtn")?.addEventListener("click", createOrUpdateRescueOperation);
    document.getElementById("cancelRescueOperationBtn")?.addEventListener("click", closeRescueOperationForm);
    document.getElementById("rescueManagementBtn")?.addEventListener("click", openRescueManagement);
    document.getElementById("closeRescueManagementBtn")?.addEventListener("click", closeRescueManagement);
    document.getElementById("newRescueEventBtn")?.addEventListener("click", openNewRescueEvent);
    document.getElementById("saveRescueEventBtn")?.addEventListener("click", createOrUpdateRescueEvent);
    document.getElementById("cancelRescueEventBtn")?.addEventListener("click", closeRescueEventForm);
    document.getElementById("editRescueOperationBtn")?.addEventListener("click", () => editRescueOperation(currentRescueOperationId));
    document.getElementById("completeRescueOperationBtn")?.addEventListener("click", completeRescueOperation);
    document.getElementById("closeRescueDetailBtn")?.addEventListener("click", closeRescueOperationDetail);
    document.getElementById("closeRescueViewModalBtn")?.addEventListener("click", closeRescueViewModal);
    document.getElementById("exportRescueJsonBtn")?.addEventListener("click", exportRescueJson);
    document.getElementById("importRescueJsonBtn")?.addEventListener("click", () => document.getElementById("rescueJsonFileInput")?.click());
    document.getElementById("rescueJsonFileInput")?.addEventListener("change", importRescueJson);
}

function selectRescueChoice(type, value) {
    if (type === "protection") selectedRescueProtection = value;
    if (type === "handling") selectedRescueHandling = value;
    const box = type === "protection" ? "rescueProtectionLevel" : "rescueHandlingMethod";
    document.querySelectorAll(`#${box} .choice-btn`).forEach(btn => btn.classList.toggle("selected", btn.dataset.value === value));
}

function clearRescueOperationForm() {
    ["rescuePersonnel","rescueArea","rescueTransectId","rescueTemperature","rescueOperationRemark"].forEach(id => { const e=document.getElementById(id); if(e)e.value=""; });
    ["rescueWeather","rescueMainHabitat","rescueDisturbanceType","rescueDisturbanceLevel"].forEach(id => { const e=document.getElementById(id); if(e)e.value=""; });
}

function openNewRescueOperation() {
    editingRescueOperationId = null;
    document.querySelector("#rescueOperationFormSection .section-title").textContent = "新建搜救作业";
    clearRescueOperationForm();
    document.getElementById("rescueOperationFormSection").classList.remove("hidden");
    document.getElementById("rescueOperationDetailSection").classList.add("hidden");
    document.getElementById("rescueEventFormSection").classList.add("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
}

function createOrUpdateRescueOperation() {
    const vals = {
        rescue_personnel: document.getElementById("rescuePersonnel").value.trim(),
        rescue_area: document.getElementById("rescueArea").value.trim(),
        transect_id: document.getElementById("rescueTransectId").value.trim(),
        weather: document.getElementById("rescueWeather").value,
        temperature: document.getElementById("rescueTemperature").value.trim(),
        main_habitat: document.getElementById("rescueMainHabitat").value,
        disturbance_type: document.getElementById("rescueDisturbanceType").value,
        disturbance_level: document.getElementById("rescueDisturbanceLevel").value,
        remark: document.getElementById("rescueOperationRemark").value.trim()
    };
    const labels = [["rescue_personnel","请输入搜救人员。"],["rescue_area","请输入搜救区域。"],["transect_id","请输入样线编号。"],["weather","请选择天气。"],["temperature","请输入温度。"],["main_habitat","请选择主要生境类型。"],["disturbance_type","请选择人为干扰类型。"],["disturbance_level","请选择人为干扰强度。"]];
    for (const [k,msg] of labels) if (!vals[k]) { alert(msg); return; }
    if (editingRescueOperationId) {
        const op=data.rescue_operations.find(x=>x.operation_id===editingRescueOperationId); if(!op||op.status==="deleted") return;
        Object.assign(op,vals); editingRescueOperationId=null; saveData(); closeRescueOperationForm(); openRescueOperationDetail(op.operation_id); alert(`已修改搜救作业：${op.operation_id}。`); return;
    }
    const id=generateNextRescueOperationId();
    const now=new Date().toISOString();
    data.rescue_operations.push({operation_id:id,status:"active",...vals,created_at:now,updated_at:now});
    currentRescueOperationId=id; saveData(); closeRescueOperationForm(); openRescueOperationDetail(id); alert(`搜救作业 ${id} 保存成功。`);
}

function generateNextRescueOperationId() {
    const used=[...data.reserved_rescue_operation_ids,...data.rescue_operations.map(x=>x.operation_id)].filter(Boolean);
    let n=1; while(used.includes(`RES${String(n).padStart(3,"0")}`)) n++;
    const id=`RES${String(n).padStart(3,"0")}`; data.reserved_rescue_operation_ids.push(id); return id;
}

function generateNextRescueEventId(operationId) {
    const used=[...data.reserved_rescue_event_ids,...data.rescue_events.map(x=>x.event_id)].filter(Boolean);
    let n=1; while(used.includes(`${operationId}_R${String(n).padStart(3,"0")}`)) n++;
    const id=`${operationId}_R${String(n).padStart(3,"0")}`; data.reserved_rescue_event_ids.push(id); return id;
}

function closeRescueOperationForm(){ document.getElementById("rescueOperationFormSection")?.classList.add("hidden"); editingRescueOperationId=null; }

function openRescueOperationDetail(id) {
    const op=data.rescue_operations.find(x=>x.operation_id===id); if(!op||op.status==="deleted") return;
    currentRescueOperationId=id; renderRescueOperationDetail();
    document.getElementById("rescueOperationDetailSection").classList.remove("hidden");
    document.getElementById("rescueManagementSection").classList.add("hidden");
    document.getElementById("rescueOperationDetailSection").scrollIntoView({behavior:"smooth",block:"start"});
}

function renderRescueOperationDetail() {
    const id=currentRescueOperationId, op=data.rescue_operations.find(x=>x.operation_id===id); if(!op) return;
    document.getElementById("rescueOperationDetailTitle").textContent=`搜救作业：${id}`;
    document.getElementById("rescueOperationDetailBody").innerHTML=`<div><span>状态</span>${op.status==="completed"?"已完成":"进行中"}</div><div><span>搜救人员</span>${escapeHtml(op.rescue_personnel)}</div><div><span>搜救区域</span>${escapeHtml(op.rescue_area)}</div><div><span>样线编号</span>${escapeHtml(op.transect_id)}</div><div><span>天气 / 温度</span>${escapeHtml(op.weather)} / ${escapeHtml(op.temperature)}</div><div><span>主要生境</span>${escapeHtml(op.main_habitat)}</div><div><span>人为干扰</span>${escapeHtml(op.disturbance_type)} / ${escapeHtml(op.disturbance_level)}</div><div><span>备注</span>${escapeHtml(op.remark||"")}</div>`;
    const events=data.rescue_events.filter(x=>x.rescue_operation_id===id);
    document.getElementById("rescueEventList").innerHTML=events.length?events.map(e=>`<div class="event-item ${e.status==="deleted"?"rescue-event-deleted":""}"><div class="event-id">${escapeHtml(e.event_id)} ${e.status==="deleted"?"· 已删除":""}</div><div class="event-main">${escapeHtml(e.rescue_object)} · ${e.quantity} 个 · ${escapeHtml(e.protection_level)} · ${escapeHtml(e.handling_method)}</div><div class="event-detail">生境：${escapeHtml(e.habitat)}${e.transfer_location?` · 转移地点：${escapeHtml(e.transfer_location)}`:""}</div><div class="management-actions"><button class="btn btn-secondary btn-small" onclick="viewRescueEvent('${escapeHtml(e.event_id)}')">查看</button>${e.status==="deleted"?`<button class="btn btn-secondary btn-small" onclick="restoreRescueEvent('${escapeHtml(e.event_id)}')">恢复</button><button class="btn btn-danger btn-small permanent-action" onclick="permanentlyDeleteRescueEvent('${escapeHtml(e.event_id)}')">彻底删除</button>`:`<button class="btn btn-secondary btn-small" onclick="editRescueEvent('${escapeHtml(e.event_id)}')">修改</button><button class="btn btn-danger btn-small" onclick="softDeleteRescueEvent('${escapeHtml(e.event_id)}')">删除</button>`}</div></div>`).join(""):"<div class='empty-state'>暂无搜救事件</div>";
    const completeBtn = document.getElementById("completeRescueOperationBtn");
    completeBtn.textContent = "完成搜救作业";
    completeBtn.disabled = op.status === "completed";
}

function editRescueOperation(id){ const op=data.rescue_operations.find(x=>x.operation_id===id); if(!op||op.status==="deleted") return; editingRescueOperationId=id; document.querySelector("#rescueOperationFormSection .section-title").textContent=`修改搜救作业：${id}`; document.getElementById("rescuePersonnel").value=op.rescue_personnel; document.getElementById("rescueArea").value=op.rescue_area; document.getElementById("rescueTransectId").value=op.transect_id; document.getElementById("rescueWeather").value=op.weather; document.getElementById("rescueTemperature").value=op.temperature; document.getElementById("rescueMainHabitat").value=op.main_habitat; document.getElementById("rescueDisturbanceType").value=op.disturbance_type; document.getElementById("rescueDisturbanceLevel").value=op.disturbance_level; document.getElementById("rescueOperationRemark").value=op.remark||""; document.getElementById("rescueOperationFormSection").classList.remove("hidden"); document.getElementById("rescueOperationDetailSection").classList.add("hidden"); window.scrollTo({top:0,behavior:"smooth"}); }

function completeRescueOperation(){ const op=data.rescue_operations.find(x=>x.operation_id===currentRescueOperationId); if(!op||op.status!=="active") return; if(!confirm(`确认完成搜救作业：${op.operation_id}？\n完成后仍可查看、修改和新增搜救事件。`)) return; op.status="completed"; saveData(); renderRescueOperationDetail(); }
function closeRescueOperationDetail(){ document.getElementById("rescueOperationDetailSection")?.classList.add("hidden"); document.getElementById("rescueEventFormSection")?.classList.add("hidden"); currentRescueOperationId=null; editingRescueEventId=null; }

function openNewRescueEvent(){ if(!currentRescueOperationId) return; const op=data.rescue_operations.find(x=>x.operation_id===currentRescueOperationId); if(!op||op.status==="deleted") return; editingRescueEventId=null; clearRescueEventForm(); document.querySelector("#rescueEventFormSection .section-title").textContent="新增搜救事件"; document.getElementById("rescueEventFormSection").classList.remove("hidden"); document.getElementById("rescueEventFormSection").scrollIntoView({behavior:"smooth",block:"start"}); }
function clearRescueEventForm(){ document.getElementById("rescueObject").value=""; document.getElementById("rescueQuantity").value=""; document.getElementById("rescueHabitat").value=""; document.getElementById("rescueTransferLocation").value=""; document.getElementById("rescueEventRemark").value=""; selectedRescueProtection=""; selectedRescueHandling=""; document.querySelectorAll("#rescueProtectionLevel .choice-btn,#rescueHandlingMethod .choice-btn").forEach(b=>b.classList.remove("selected")); }
function closeRescueEventForm(){ document.getElementById("rescueEventFormSection")?.classList.add("hidden"); editingRescueEventId=null; clearRescueEventForm(); }

function createOrUpdateRescueEvent(){
    const object=document.getElementById("rescueObject").value.trim(); const quantity=Number(document.getElementById("rescueQuantity").value); const habitat=document.getElementById("rescueHabitat").value; const transfer=document.getElementById("rescueTransferLocation").value.trim(); const remark=document.getElementById("rescueEventRemark").value.trim();
    if(!object){alert("请输入搜救对象。");return;} if(!Number.isInteger(quantity)||quantity<1){alert("数量必须为正整数。");return;} if(!selectedRescueProtection){alert("请选择保护级别。");return;} if(!habitat){alert("请选择生境类型。");return;} if(!selectedRescueHandling){alert("请选择处理方式。");return;}
    if(editingRescueEventId){ const e=data.rescue_events.find(x=>x.event_id===editingRescueEventId); if(!e||e.status==="deleted")return; Object.assign(e,{rescue_object:object,quantity,protection_level:selectedRescueProtection,habitat,handling_method:selectedRescueHandling,transfer_location:transfer||null,remark}); editingRescueEventId=null; saveData(); closeRescueEventForm(); copyToClipboard(generateRescueEventText(e)); alert(`已修改 ${e.event_id}，更新后的搜救事件记录已复制。`); openRescueOperationDetail(e.rescue_operation_id); return; }
    const id=generateNextRescueEventId(currentRescueOperationId); const now=new Date().toISOString(); const e={event_id:id,rescue_operation_id:currentRescueOperationId,rescue_object:object,quantity,protection_level:selectedRescueProtection,habitat,handling_method:selectedRescueHandling,transfer_location:transfer||null,remark,status:"active",created_at:now,updated_at:now}; data.rescue_events.push(e); saveData(); closeRescueEventForm(); copyToClipboard(generateRescueEventText(e)); alert(`搜救事件 ${id} 保存成功，标准化记录已复制。`); openRescueOperationDetail(currentRescueOperationId);
}
function generateRescueEventText(e){ return `【搜救事件】\n事件=${e.event_id}\n搜救对象=${e.rescue_object}\n数量=${e.quantity}\n保护级别=${e.protection_level}\n生境类型=${e.habitat}\n处理方式=${e.handling_method}\n转移地点=${e.transfer_location===null?"NULL":e.transfer_location}\n备注=${e.remark?e.remark:"NULL"}`; }
function editRescueEvent(id){ const e=data.rescue_events.find(x=>x.event_id===id); if(!e||e.status==="deleted")return; currentRescueOperationId=e.rescue_operation_id; editingRescueEventId=id; document.querySelector("#rescueEventFormSection .section-title").textContent=`修改搜救事件：${id}`; document.getElementById("rescueObject").value=e.rescue_object; document.getElementById("rescueQuantity").value=e.quantity; document.getElementById("rescueHabitat").value=e.habitat; document.getElementById("rescueTransferLocation").value=e.transfer_location||""; document.getElementById("rescueEventRemark").value=e.remark||""; selectRescueChoice("protection",e.protection_level); selectRescueChoice("handling",e.handling_method); document.getElementById("rescueEventFormSection").classList.remove("hidden"); document.getElementById("rescueOperationDetailSection").classList.add("hidden"); document.getElementById("rescueEventFormSection").scrollIntoView({behavior:"smooth",block:"start"}); }
function viewRescueEvent(id){ const e=data.rescue_events.find(x=>x.event_id===id); if(!e)return; document.getElementById("rescueViewModalTitle").textContent=`搜救事件：${id}`; document.getElementById("rescueViewModalBody").innerHTML=`<div class="detail-list"><div><span>状态</span>${e.status==="deleted"?"已删除":"有效"}</div><div><span>搜救作业</span>${escapeHtml(e.rescue_operation_id)}</div><div><span>搜救对象</span>${escapeHtml(e.rescue_object)}</div><div><span>数量</span>${e.quantity}</div><div><span>保护级别</span>${escapeHtml(e.protection_level)}</div><div><span>生境类型</span>${escapeHtml(e.habitat)}</div><div><span>处理方式</span>${escapeHtml(e.handling_method)}</div><div><span>转移地点</span>${escapeHtml(e.transfer_location||"")}</div><div><span>备注</span>${escapeHtml(e.remark||"")}</div></div>`; document.getElementById("rescueViewModal").classList.remove("hidden"); }
function closeRescueViewModal(){document.getElementById("rescueViewModal")?.classList.add("hidden");}
function softDeleteRescueEvent(id){ const e=data.rescue_events.find(x=>x.event_id===id); if(!e||e.status==="deleted")return; if(!confirm(`搜救事件：${id}\n将进入已删除状态，是否确认？`))return; e.status="deleted"; e.deleted_reason="user_deleted"; saveData(); renderRescueOperationDetail(); }
function restoreRescueEvent(id){ const e=data.rescue_events.find(x=>x.event_id===id); if(!e||e.status!=="deleted")return; const op=data.rescue_operations.find(x=>x.operation_id===e.rescue_operation_id); if(!op||op.status==="deleted"){alert("该事件所属搜救作业已删除，请先恢复作业。");return;} e.status="active"; delete e.deleted_reason; saveData(); renderRescueOperationDetail(); }
function permanentlyDeleteRescueEvent(id){ const e=data.rescue_events.find(x=>x.event_id===id); if(!e||e.status!=="deleted")return; if(!confirm(`搜救事件：${id}\n将彻底删除，是否确认。`))return; if(!confirm("此操作将无法恢复。"))return; data.rescue_events=data.rescue_events.filter(x=>x.event_id!==id); saveData(); renderRescueOperationDetail(); }

function openRescueManagement(){ document.getElementById("rescueManagementSection").classList.remove("hidden"); document.getElementById("rescueOperationFormSection").classList.add("hidden"); document.getElementById("rescueOperationDetailSection").classList.add("hidden"); document.getElementById("rescueEventFormSection").classList.add("hidden"); renderRescueManagement(); document.getElementById("rescueManagementSection").scrollIntoView({behavior:"smooth",block:"start"}); }
function closeRescueManagement(){document.getElementById("rescueManagementSection")?.classList.add("hidden");}
function renderRescueManagement(){ const list=document.getElementById("rescueManagementList"); if(!list)return; if(!data.rescue_operations.length){list.innerHTML='<div class="empty-state">暂无搜救作业</div>';return;} list.innerHTML=data.rescue_operations.map(op=>{const deleted=op.status==="deleted"; const completed=op.status==="completed"; const count=data.rescue_events.filter(e=>e.rescue_operation_id===op.operation_id).length; return `<div class="management-item ${deleted?"is-deleted":""}"><div class="management-main"><div class="management-title">${escapeHtml(op.operation_id)}</div><div class="management-meta">${escapeHtml(op.rescue_area)} · ${count} 条搜救事件 · <span class="status-badge ${deleted?"rescue-status-deleted":completed?"rescue-status-completed":"status-active"}">${deleted?"已删除":completed?"已完成":"进行中"}</span></div></div><div class="management-actions"><button class="btn btn-secondary btn-small" onclick="viewRescueOperation('${escapeHtml(op.operation_id)}')">查看</button>${deleted?`<button class="btn btn-secondary btn-small" onclick="restoreRescueOperation('${escapeHtml(op.operation_id)}')">恢复</button><button class="btn btn-danger btn-small permanent-action" onclick="permanentlyDeleteRescueOperation('${escapeHtml(op.operation_id)}')">彻底删除</button>`:`<button class="btn btn-secondary btn-small" onclick="editRescueOperation('${escapeHtml(op.operation_id)}')">修改</button><button class="btn btn-danger btn-small" onclick="softDeleteRescueOperation('${escapeHtml(op.operation_id)}')">删除</button>`}</div></div>`;}).join(""); }
function viewRescueOperation(id){ const op=data.rescue_operations.find(x=>x.operation_id===id); if(!op)return; if(op.status!=="deleted"){openRescueOperationDetail(id);return;} document.getElementById("rescueViewModalTitle").textContent=`搜救作业：${id}`; const events=data.rescue_events.filter(e=>e.rescue_operation_id===id); document.getElementById("rescueViewModalBody").innerHTML=`<div class="detail-list"><div><span>状态</span>已删除</div><div><span>搜救人员</span>${escapeHtml(op.rescue_personnel)}</div><div><span>搜救区域</span>${escapeHtml(op.rescue_area)}</div><div><span>样线编号</span>${escapeHtml(op.transect_id)}</div><div><span>搜救事件</span>${events.length} 条</div><div><span>备注</span>${escapeHtml(op.remark||"")}</div></div>`; document.getElementById("rescueViewModal").classList.remove("hidden"); }
function softDeleteRescueOperation(id){ const op=data.rescue_operations.find(x=>x.operation_id===id); if(!op||op.status==="deleted")return; if(!confirm(`搜救作业：${id}\n将进入已删除状态，其下搜救事件也将随作业删除。是否确认？`))return; op.previous_status=op.status; op.status="deleted"; op.deleted_event_states={}; data.rescue_events.filter(e=>e.rescue_operation_id===id).forEach(e=>{op.deleted_event_states[e.event_id]=e.status;e.status="deleted";e.deleted_reason="operation_deleted";}); saveData(); renderRescueManagement(); }
function restoreRescueOperation(id){ const op=data.rescue_operations.find(x=>x.operation_id===id); if(!op||op.status!=="deleted")return; op.status=op.previous_status||"active"; const states=op.deleted_event_states||{}; data.rescue_events.filter(e=>e.rescue_operation_id===id).forEach(e=>{if(e.deleted_reason==="operation_deleted"){const prior=states[e.event_id]||"active";e.status=prior;delete e.deleted_reason;}}); delete op.deleted_event_states; delete op.previous_status; saveData(); renderRescueManagement(); }
function permanentlyDeleteRescueOperation(id){ const op=data.rescue_operations.find(x=>x.operation_id===id); if(!op||op.status!=="deleted")return; const count=data.rescue_events.filter(e=>e.rescue_operation_id===id).length; if(!confirm(`搜救作业：${id}  搜救事件：${count} 条  将彻底删除，是否确认。`))return; if(!confirm("此操作将无法恢复。"))return; data.rescue_operations=data.rescue_operations.filter(x=>x.operation_id!==id); data.rescue_events=data.rescue_events.filter(e=>e.rescue_operation_id!==id); if(currentRescueOperationId===id)currentRescueOperationId=null; saveData(); renderRescueManagement(); }

function exportRescueJson(){ const payload={backup_format:"EcoSurvey_Rescue_JSON",backup_version:"1.0",data:{rescue_operations:data.rescue_operations,rescue_events:data.rescue_events,reserved_rescue_operation_ids:data.reserved_rescue_operation_ids,reserved_rescue_event_ids:data.reserved_rescue_event_ids}}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}); const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="EcoSurvey_Rescue_JSON.json";a.click();URL.revokeObjectURL(a.href); }
async function importRescueJson(ev){ const file=ev.target.files?.[0]; ev.target.value=""; if(!file)return; try{const parsed=JSON.parse(await file.text()); const d=parsed?.data; if(parsed.backup_format!=="EcoSurvey_Rescue_JSON"||parsed.backup_version!=="1.0"||!d||!Array.isArray(d.rescue_operations)||!Array.isArray(d.rescue_events)||!Array.isArray(d.reserved_rescue_operation_ids)||!Array.isArray(d.reserved_rescue_event_ids))throw new Error("格式不正确"); const opIds=new Set(d.rescue_operations.map(x=>x.operation_id)); if(d.rescue_operations.some(x=>!/^RES\d{3}$/.test(x.operation_id)||!['active','completed','deleted'].includes(x.status)))throw new Error("搜救作业数据无效"); if(d.rescue_events.some(x=>!/^RES\d{3}_R\d{3}$/.test(x.event_id)||!opIds.has(x.rescue_operation_id)||!['active','deleted'].includes(x.status)))throw new Error("搜救事件数据无效"); if(d.reserved_rescue_operation_ids.some(x=>typeof x!=="string")||d.reserved_rescue_event_ids.some(x=>typeof x!=="string"))throw new Error("ID保留池无效"); if(!confirm("导入将只替换当前搜救数据，不影响样线调查数据。是否继续？"))return; data.rescue_operations=d.rescue_operations;data.rescue_events=d.rescue_events;data.reserved_rescue_operation_ids=d.reserved_rescue_operation_ids;data.reserved_rescue_event_ids=d.reserved_rescue_event_ids;currentRescueOperationId=null;saveData();renderRescueManagement();alert("搜救数据导入成功。");}catch(err){alert(`搜救数据导入失败：${err.message}`);} }

initRescueModule();
