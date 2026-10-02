import "server-only";
import { MOTION_MECHANICS, CANV_RUNTIME_HELPERS } from "./mechanics-library";
import { getFullDirectingRulesSummary, DIRECTING_RULES } from "./directing-rules";

export const AGENTIC_TOOLS_SCHEMA = [
  {
    type: "function",
    function: {
      name: "get_available_motion_mechanics",
      description: "استعراض قائمة آليات التحريك الجاهزة في ستوديو الموشن (مثل العداد الميكانيكي، شبكة النقاط، البطاقات القلابة، عداد السرعة، الأعمدة البيانية، وغيرها) لمعرفة متى وكيف تستخدم كل آلية.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["all", "data", "comparison", "process", "display"],
            description: "تصنيف الحركة المطلوب (بيانات، مقارنة، مراحل، أو عرض)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_mechanic_code",
      description: "طلب الكود البرمجي الدقيق وقواعد الرسم الفيزيائي لآليات تحريك محددة بالاسم (مثل odometer أو flipCard أو gauge) لتضمينها في المشهد.",
      parameters: {
        type: "object",
        properties: {
          mechanic_names: {
            type: "array",
            items: { type: "string" },
            description: "قائمة بأسماء الآليات المطلوبة (مثال: ['odometer', 'flipCard', 'gauge'])",
          },
        },
        required: ["mechanic_names"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_directing_rules",
      description: "طلب دستور الإخراج الفني وقواعد الحركة (دورة حياة العنصر من البرود إلى التوهج، الهرمية اللونية، حماية الخطوط العربية، والمناطق الآمنة لشاشات الجوال 9:16).",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["all", "lifecycle", "colors", "safezones", "typography"],
            description: "الموضوع الإخراجي المطلوب",
          },
        },
      },
    },
  },
];

export async function executeAgenticTool(
  name: string,
  args: any
): Promise<{ success: boolean; result: any }> {
  try {
    switch (name) {
      case "get_available_motion_mechanics": {
        const cat = args?.category || "all";
        const list = Object.values(MOTION_MECHANICS)
          .filter((m) => cat === "all" || m.category === cat)
          .map((m) => ({
            id: m.id,
            nameArabic: m.nameArabic,
            category: m.category,
            bestFor: m.bestFor,
            parameters: m.parameters,
            exampleCall: m.exampleCall,
          }));
        return {
          success: true,
          result: {
            count: list.length,
            mechanics: list,
            note: "اختر آلية مختلفة لكل مشهد لتفادي التكرار، ثم اطلب كودها عبر أداة get_mechanic_code.",
          },
        };
      }

      case "get_mechanic_code": {
        const names: string[] = Array.isArray(args?.mechanic_names)
          ? args.mechanic_names
          : [];
        const foundCodes: Record<string, string> = {};
        const missing: string[] = [];

        for (const n of names) {
          if (MOTION_MECHANICS[n]) {
            foundCodes[n] = MOTION_MECHANICS[n].code;
          } else {
            missing.push(n);
          }
        }

        return {
          success: true,
          result: {
            helpers: CANV_RUNTIME_HELPERS,
            codes: foundCodes,
            missing: missing.length > 0 ? missing : undefined,
            usageGuide:
              "قم بتضمين هذه الدوال مباشرة داخل دالة رسم المشهد واستدعها باستخدام معامل التقدم k أو الوقت t.",
          },
        };
      }

      case "get_directing_rules": {
        const topic = args?.topic || "all";
        let rulesContent = "";
        if (topic === "lifecycle") rulesContent = DIRECTING_RULES.elementLifeCycle;
        else if (topic === "colors") rulesContent = DIRECTING_RULES.visualHierarchyAndColors;
        else if (topic === "safezones" || topic === "typography")
          rulesContent = DIRECTING_RULES.typographyAndSafeZones;
        else rulesContent = getFullDirectingRulesSummary();

        return {
          success: true,
          result: {
            rules: rulesContent,
            strictChecklist: [
              "هل يمر العنصر بالحالات الثلاث (Cold -> Live -> Done)؟",
              "هل التباين اللوني محقق بين التوهج والخلفية؟",
              "هل وزنت خط القاهرة على 700 فقط؟",
              "هل راعيت المنطقة الآمنة للريلز (1080x1920)؟",
            ],
          },
        };
      }

      default:
        return {
          success: false,
          result: `أداة غير معروفة: ${name}`,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      result: `خطأ أثناء تنفيذ الأداة: ${err.message}`,
    };
  }
}
