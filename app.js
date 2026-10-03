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

    reserved_event_ids: []

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
