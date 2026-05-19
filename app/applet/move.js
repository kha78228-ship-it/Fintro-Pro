import fs from "fs";

const file = fs.readFileSync("src/components/SettingsView.tsx", "utf-8");
const lines = file.split("\n");

// 475 to 640 are lines[474] to lines[639]
const adminLines = lines.slice(474, 640).join("\n");
lines.splice(474, 640 - 474 + 1);

const insertContent = `
      {activeTab === 'system' && (
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {!isAdmin && !isSuperAdmin ? (
               <div className="card p-8 text-center text-neutral-500">
                  Phần này chỉ dành cho quản trị viên hệ thống.
               </div>
            ) : (
               <>
${adminLines}
               </>
            )}
         </motion.div>
      )}
`;

const endAnimate = lines.lastIndexOf("      </AnimatePresence>");
if (endAnimate !== -1) {
    lines.splice(endAnimate, 0, insertContent);
}

fs.writeFileSync("src/components/SettingsView.tsx", lines.join("\n"));
console.log("Moved!");
