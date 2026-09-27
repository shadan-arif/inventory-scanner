import React, { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronUp, Copy, RotateCcw, Terminal, Trash2, X } from "lucide-react-native";
import { LogEntry, scannerLogger } from "../services/logger";

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  warn: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  error: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  success: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
};

export function LogsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>(scannerLogger.getLogs());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLogs(scannerLogger.getLogs());
    return scannerLogger.subscribe(() => {
      setLogs([...scannerLogger.getLogs()]);
    });
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Terminal size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.title}>Scanner & App Diagnostics</Text>
                <Text style={styles.subtitle}>{logs.length} events logged</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityLabel="Clear logs"
                onPress={() => scannerLogger.clear()}
                style={styles.actionBtn}
              >
                <Trash2 size={16} color="#64748b" />
              </Pressable>
              <Pressable accessibilityLabel="Close logs" onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#0f172a" />
              </Pressable>
            </View>
          </View>

          {/* Logs List */}
          {logs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Terminal size={36} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No logs recorded yet</Text>
              <Text style={styles.emptySub}>
                Interact with the camera or barcode scanner to see real-time diagnostics and error logs here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const colors = LEVEL_COLORS[item.level] || LEVEL_COLORS.info;
                const isExpanded = expandedId === item.id;
                const hasDetails = item.details !== undefined && item.details !== null;

                return (
                  <Pressable
                    onPress={() => hasDetails && setExpandedId(isExpanded ? null : item.id)}
                    style={[styles.logItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.logHeader}>
                      <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.text }]}>{item.level.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.tagText}>[{item.tag}]</Text>
                      <Text style={styles.timeText}>{item.timestamp}</Text>
                      {hasDetails && (
                        <View style={styles.expandIcon}>
                          {isExpanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                        </View>
                      )}
                    </View>
                    <Text style={styles.messageText}>{item.message}</Text>
                    {isExpanded && hasDetails && (
                      <View style={styles.detailsBox}>
                        <Text style={styles.detailsText}>
                          {typeof item.details === "object"
                            ? JSON.stringify(item.details, null, 2)
                            : String(item.details)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTip}>Logs remain persistent until cleared or app restart.</Text>
            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  listContent: {
    padding: 14,
    gap: 8,
  },
  logItem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  timeText: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: "auto",
    fontFamily: "monospace",
  },
  expandIcon: {
    marginLeft: 4,
  },
  messageText: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 18,
  },
  detailsBox: {
    marginTop: 6,
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 6,
  },
  detailsText: {
    color: "#38bdf8",
    fontSize: 11,
    fontFamily: "monospace",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptySub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  footerTip: {
    fontSize: 11,
    color: "#64748b",
    flex: 1,
  },
  doneBtn: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});
