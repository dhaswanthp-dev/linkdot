import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import type { Link } from "@/lib/data/links";

interface LinkRowProps {
  link: Link;
  isActive: boolean;
  onDrag: () => void;
  onToggleVisibility: (isVisible: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LinkRow({
  link,
  isActive,
  onDrag,
  onToggleVisibility,
  onEdit,
  onDelete,
}: LinkRowProps) {
  return (
    <View
      style={[
        styles.row,
        !link.is_visible && styles.hidden,
        isActive && styles.active,
      ]}
    >
      <Pressable
        accessibilityLabel={`Drag handle for ${link.title}. Long press to reorder.`}
        accessibilityRole="button"
        onLongPress={onDrag}
        style={styles.dragHandle}
      >
        <Text style={styles.dragGlyph}>⠿</Text>
      </Pressable>

      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.title}>
          {link.title}
        </Text>
        <Text numberOfLines={1} style={styles.url}>
          {link.url}
        </Text>
        <View style={styles.actions}>
          <View style={styles.visibility}>
            <Text style={styles.actionLabel}>
              {link.is_visible ? "Shown" : "Hidden"}
            </Text>
            <Switch
              accessibilityLabel={`${link.is_visible ? "Hide" : "Show"} ${link.title}`}
              accessibilityRole="switch"
              accessibilityState={{ checked: link.is_visible }}
              onValueChange={onToggleVisibility}
              value={link.is_visible}
              trackColor={{ false: "#cfc5b5", true: "#10231a" }}
              thumbColor="#ffffff"
            />
          </View>
          <Pressable
            accessibilityLabel={`Edit ${link.title}`}
            accessibilityRole="button"
            onPress={onEdit}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Delete ${link.title}`}
            accessibilityRole="button"
            onPress={onDelete}
            style={styles.actionButton}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5dbca",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    minHeight: 112,
    padding: 12,
  },
  hidden: {
    opacity: 0.58,
  },
  active: {
    borderColor: "#0a8cff",
    opacity: 0.82,
  },
  dragHandle: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  dragGlyph: {
    color: "#5e625d",
    fontSize: 24,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: "#10231a",
    fontSize: 16,
    fontWeight: "700",
  },
  url: {
    color: "#6d7069",
    fontSize: 13,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  visibility: {
    alignItems: "center",
    flexDirection: "row",
    marginRight: "auto",
  },
  actionLabel: {
    color: "#575b54",
    fontSize: 12,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 52,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    color: "#10231a",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  deleteText: {
    color: "#a83224",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
