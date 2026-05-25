import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { addDays, format, differenceInDays, parseISO, startOfDay } from 'date-fns';

/**
 * Automatically creates notification documents in the database for upcoming outings or periods
 * (1-2 days before they occur) so they are kept in sync with the notification system.
 */
export async function generateRemindersAndNotifications(userId: string) {
  if (!userId) return;
  const today = startOfDay(new Date());

  try {
    // 1. Fetch Cycle Reminders
    const q = query(collection(db, 'shared_funds'), where('memberIds', 'array-contains', userId));
    const fundsSnap = await getDocs(q);
    
    let isFamilyMode = false;
    let familyId = '';

    // We can collect cycle data from Firestore if we find family funds
    if (!fundsSnap.empty) {
      isFamilyMode = true;
      const fundDoc = fundsSnap.docs[0];
      familyId = fundDoc.id;
      const fundData = fundDoc.data();
      const membersList = fundData.members || {};

      for (const [memberUid, member] of Object.entries(membersList) as [string, any][]) {
        const cycleData = member.cycleData;
        if (cycleData && cycleData.lastPeriod && cycleData.cycleLength > 0) {
          const shareWithFamily = cycleData.shareWithFamily !== false;
          // Only process shared details, or own details
          if (memberUid === userId || shareWithFamily) {
            let lastDate: Date;
            try {
              lastDate = parseISO(cycleData.lastPeriod);
            } catch (e) {
              lastDate = new Date(cycleData.lastPeriod);
            }
            const cycleLength = cycleData.cycleLength;
            const periodReminderDays = cycleData.periodReminderDays ?? 2;
            const ovulationReminderDays = cycleData.ovulationReminderDays ?? 2;

            // Calculate next period date
            const nextPeriodDate = addDays(lastDate, cycleLength);
            const daysUntilPeriod = differenceInDays(startOfDay(nextPeriodDate), today);

            // Period reminder
            if (daysUntilPeriod >= 0 && daysUntilPeriod <= periodReminderDays) {
              const docId = `cycle_period_${memberUid}_${nextPeriodDate.toISOString().substring(0, 10)}`;
              const notifRef = doc(db, `users/${userId}/notifications`, docId);
              
              // Check if already notified
              const snap = await getDoc(notifRef);
              if (!snap.exists()) {
                const dateStr = format(nextPeriodDate, 'dd/MM/yyyy');
                let title = '';
                let desc = '';
                
                if (memberUid === userId) {
                  title = '🌸 Sắp tới ngày dâu của bạn!';
                  desc = `Dự kiến kỳ rụng dâu tiếp theo của bạn sẽ bắt đầu vào ngày ${dateStr} (còn ${daysUntilPeriod} ngày). Hãy chú ý giữ ấm, nghỉ ngơi và chuẩn bị đồ chu đáo nhé!`;
                } else {
                  title = `🌸 Nhắc nhở dịu dàng cho chu kỳ người ấy!`;
                  desc = `Kỳ rụng dâu dự kiến của ${member.displayName || 'người ấy'} sẽ bắt đầu vào ngày ${dateStr} (còn ${daysUntilPeriod} ngày). Hãy dành nhiều sự quan tâm ngọt ngào, thấu cảm và chăm sóc chu đáo cho người ấy nha!`;
                }

                const now = new Date();
                const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;
                
                await setDoc(notifRef, {
                  type: 'period_reminder',
                  title,
                  description: desc,
                  time: timeLabel,
                  read: false,
                  createdAt: Date.now()
                });
              }
            }

            // Ovulation reminder
            const ovulationDate = addDays(nextPeriodDate, -14);
            const daysUntilOvulation = differenceInDays(startOfDay(ovulationDate), today);
            
            if (daysUntilOvulation >= 0 && daysUntilOvulation <= ovulationReminderDays) {
              const docId = `cycle_ovulation_${memberUid}_${ovulationDate.toISOString().substring(0, 10)}`;
              const notifRef = doc(db, `users/${userId}/notifications`, docId);
              
              const snap = await getDoc(notifRef);
              if (!snap.exists()) {
                const dateStr = format(ovulationDate, 'dd/MM/yyyy');
                let title = '';
                let desc = '';
                
                if (memberUid === userId) {
                  title = '✨ Đến ngày rụng trứng!';
                  desc = `Dự kiến ngày rụng trứng của bạn là ngày ${dateStr} (còn ${daysUntilOvulation} ngày). Tâm trạng của bạn có thể sẽ tích cực hơn và cơ thể tràn đầy sức sống.`;
                } else {
                  title = `✨ Cửa sổ rạng rỡ của người ấy!`;
                  desc = `Dự kiến ngày rụng trứng của ${member.displayName || 'người ấy'} sẽ diễn ra vào ngày ${dateStr} (còn ${daysUntilOvulation} ngày). Hãy lên kế hoạch một buổi tối hẹn hò ngọt ngào và lãng mạn cùng người ấy nhé!`;
                }

                const now = new Date();
                const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;

                await setDoc(notifRef, {
                  type: 'period_reminder',
                  title,
                  description: desc,
                  time: timeLabel,
                  read: false,
                  createdAt: Date.now()
                });
              }
            }
          }
        }
      }
    } else {
      // Local/Personal mode cycle tracking check if data was saved locally but online sync isn't set
      const saved = localStorage.getItem('__fintrack_cycle');
      if (saved) {
        try {
          const cycleData = JSON.parse(saved);
          if (cycleData && cycleData.lastPeriod && cycleData.cycleLength > 0) {
            let lastDate: Date;
            try {
              lastDate = parseISO(cycleData.lastPeriod);
            } catch (e) {
              lastDate = new Date(cycleData.lastPeriod);
            }
            const cycleLength = cycleData.cycleLength;
            const periodReminderDays = cycleData.periodReminderDays ?? 2;

            const nextPeriodDate = addDays(lastDate, cycleLength);
            const daysUntilPeriod = differenceInDays(startOfDay(nextPeriodDate), today);

            if (daysUntilPeriod >= 0 && daysUntilPeriod <= periodReminderDays) {
              const docId = `cycle_period_${userId}_${nextPeriodDate.toISOString().substring(0, 10)}`;
              const notifRef = doc(db, `users/${userId}/notifications`, docId);
              const snap = await getDoc(notifRef);
              if (!snap.exists()) {
                const dateStr = format(nextPeriodDate, 'dd/MM/yyyy');
                const now = new Date();
                const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;
                
                await setDoc(notifRef, {
                  type: 'period_reminder',
                  title: '🌸 Sắp tới ngày dâu của bạn!',
                  description: `Dự kiến kỳ rụng dâu tiếp theo của bạn sẽ bắt đầu vào ngày ${dateStr} (còn ${daysUntilPeriod} ngày). Hãy chuẩn bị đồ và chú ý giữ gìn sức khỏe nhé!`,
                  time: timeLabel,
                  read: false,
                  createdAt: Date.now()
                });
              }
            }
          }
        } catch (e) {
          console.warn('Error checking local cycle data for reminder:', e);
        }
      }
    }

    // 2. Fetch Calendar Event Reminders
    let calendarEvents: any[] = [];
    if (isFamilyMode && familyId) {
      const eventsDocSnap = await getDoc(doc(db, 'couple_data', `calendar_${familyId}`));
      if (eventsDocSnap.exists()) {
        calendarEvents = eventsDocSnap.data().events || [];
      }
    } else {
      const userDocSnap = await getDoc(doc(db, 'users', userId));
      if (userDocSnap.exists() && userDocSnap.data().calendarEvents) {
        calendarEvents = userDocSnap.data().calendarEvents || [];
      } else {
        const savedEvents = localStorage.getItem('__family_events');
        if (savedEvents) {
          try { calendarEvents = JSON.parse(savedEvents); } catch (e) {}
        }
      }
    }

    for (const ev of calendarEvents) {
      if (ev.date && ev.title) {
        let evDate: Date;
        try {
          evDate = parseISO(ev.date);
        } catch (e) {
          evDate = new Date(ev.date + 'T00:00:00');
        }

        const daysUntilEvent = differenceInDays(startOfDay(evDate), today);
        // Remind 1 or 2 days prior to event (excluding elapsed events)
        if (daysUntilEvent >= 0 && daysUntilEvent <= 2) {
          const docId = `cal_event_rem_${ev.id}_${ev.date}`;
          const notifRef = doc(db, `users/${userId}/notifications`, docId);
          const snap = await getDoc(notifRef);
          
          if (!snap.exists()) {
            const dateStr = format(evDate, 'dd/MM/yyyy');
            const now = new Date();
            const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;

            let title = '';
            let desc = '';

            const formatDaysLeft = daysUntilEvent === 0 ? 'hôm nay' : daysUntilEvent === 1 ? 'ngày mai' : '2 ngày nữa';

            if (ev.type === 'outing') {
              title = '🎒 Sắp đến lịch đi chơi rồi!';
              desc = `Kế hoạch đi chơi "${ev.title}" của bạn sẽ diễn ra vào lúc ${ev.time || 'cả ngày'} ${formatDaysLeft} (ngày ${dateStr}). Hãy chuẩn bị sẵn sàng quần áo đẹp để tỏa sáng nha! 🥰`;
            } else {
              title = '📅 Nhắc nhở lịch trình sắp diễn ra';
              desc = `Hoạt động "${ev.title}" đã được định lịch vào ${ev.time || 'cả ngày'} ${formatDaysLeft} (ngày ${dateStr}). Đừng quên kiểm tra lịch trình của mình!`;
            }

            await setDoc(notifRef, {
              type: 'calendar_reminder',
              title,
              description: desc,
              time: timeLabel,
              read: false,
              createdAt: Date.now()
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error resolving user reminders and custom notifications:', err);
  }
}

/**
 * Creates a system notification indicating a successful backup of financials or photos.
 */
export async function createBackupNotification(userId: string, backupName: string, type: 'financials' | 'photos' | 'auto') {
  try {
    let title = '💾 Bản sao lưu thành công!';
    let desc = '';
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ngày ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    if (type === 'financials') {
      desc = `Dữ liệu báo cáo tài chính đã được sao lưu thủ công thành công lên Google Drive với bản ghi "${backupName}" lúc ${timeStr}.`;
    } else if (type === 'photos') {
      desc = `Toàn bộ ảnh nhật ký đã được đồng bộ hóa và sao lưu an toàn lên thư mục Google Drive lúc ${timeStr}.`;
    } else {
      desc = `Hệ thống vừa tự động hoàn tất tải bản sao lưu định kỳ "${backupName}" lên Google Drive của bạn lúc ${timeStr}.`;
    }

    await addDoc(collection(db, `users/${userId}/notifications`), {
      type: 'backup',
      title,
      description: desc,
      time: timeStr,
      read: false,
      createdAt: Date.now()
    });
  } catch (err) {
    console.error('Error creating backup notification:', err);
  }
}
