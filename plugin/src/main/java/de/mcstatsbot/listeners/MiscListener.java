package de.mcstatsbot.listeners;

import de.mcstatsbot.MCStatsBot;
import de.mcstatsbot.config.ConfigManager;
import de.mcstatsbot.database.DatabaseManager;
import de.mcstatsbot.tracking.AFKTracker;
import org.bukkit.Location;
import org.bukkit.block.Biome;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Item;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.enchantment.EnchantItemEvent;
import org.bukkit.event.entity.EntityBreedEvent;
import org.bukkit.event.entity.EntityPickupItemEvent;
import org.bukkit.event.entity.EntityTameEvent;
import org.bukkit.event.inventory.CraftItemEvent;
import org.bukkit.event.player.*;
import org.bukkit.inventory.ItemStack;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class MiscListener implements Listener {

    private final MCStatsBot plugin;
    private final DatabaseManager db;
    private final ConfigManager config;
    private final AFKTracker afkTracker;

    // Movement accumulation: uuid -> [walked, sprinted, flown, swum, ridden]
    private final Map<UUID, double[]> movementBuffer = new ConcurrentHashMap<>();
    // Track last chunk per player to avoid duplicate chunk exploration records
    private final Map<UUID, String> lastChunk = new ConcurrentHashMap<>();
    // Track last biome per player
    private final Map<UUID, String> lastBiome = new ConcurrentHashMap<>();

    public MiscListener(MCStatsBot plugin) {
        this.plugin = plugin;
        this.db = plugin.getDatabaseManager();
        this.config = plugin.getConfigManager();
        this.afkTracker = plugin.getAfkTracker();

        // Flush movement buffer every 30 seconds
        plugin.getServer().getScheduler().runTaskTimerAsynchronously(plugin, this::flushMovement, 600L, 600L);
    }

    // ── Crafting ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onCraftItem(CraftItemEvent event) {
        if (!config.isTrackItems()) return;
        if (!(event.getWhoClicked() instanceof Player player)) return;

        ItemStack result = event.getRecipe().getResult();
        int amount = result.getAmount();

        // Shift-click crafts multiple
        if (event.isShiftClick()) {
            amount = calculateShiftCraftAmount(event);
        }

        db.recordItemCrafted(player.getUniqueId().toString(), player.getName(),
                result.getType().name(), amount);
    }

    // ── Item Pickup ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemPickup(EntityPickupItemEvent event) {
        if (!config.isTrackItems()) return;
        if (!(event.getEntity() instanceof Player player)) return;

        Item item = event.getItem();
        ItemStack stack = item.getItemStack();
        db.recordItemPickup(player.getUniqueId().toString(), player.getName(),
                stack.getType().name(), stack.getAmount());
    }

    // ── Item Drop ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemDrop(PlayerDropItemEvent event) {
        if (!config.isTrackItems()) return;

        Player player = event.getPlayer();
        ItemStack stack = event.getItemDrop().getItemStack();
        db.recordItemDrop(player.getUniqueId().toString(), player.getName(),
                stack.getType().name(), stack.getAmount());
    }

    // ── Item Consume ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemConsume(PlayerItemConsumeEvent event) {
        if (!config.isTrackItems()) return;

        Player player = event.getPlayer();
        db.recordItemConsumed(player.getUniqueId().toString(), player.getName(),
                event.getItem().getType().name());
    }

    // ── Advancements ──

    @EventHandler(priority = EventPriority.MONITOR)
    public void onAdvancement(PlayerAdvancementDoneEvent event) {
        // Skip recipe advancements
        String key = event.getAdvancement().getKey().toString();
        if (key.contains("recipe/") || key.contains("recipes/")) return;

        Player player = event.getPlayer();
        db.recordAdvancement(player.getUniqueId().toString(), player.getName(), key);
    }

    // ── XP ──

    @EventHandler(priority = EventPriority.MONITOR)
    public void onXpChange(PlayerExpChangeEvent event) {
        if (event.getAmount() <= 0) return;

        Player player = event.getPlayer();
        db.recordXpGain(player.getUniqueId().toString(), player.getName(), event.getAmount());
    }

    // ── Enchanting ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEnchant(EnchantItemEvent event) {
        Player player = event.getEnchanter();
        String item = event.getItem().getType().name();

        event.getEnchantsToAdd().forEach((enchant, level) ->
                db.recordEnchantment(player.getUniqueId().toString(), player.getName(),
                        item, enchant.getKey().getKey(), level));
    }

    // ── Portal ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPortal(PlayerPortalEvent event) {
        Player player = event.getPlayer();
        String portalType = switch (event.getCause()) {
            case NETHER_PORTAL -> "NETHER";
            case END_PORTAL -> "END";
            case END_GATEWAY -> "END_GATEWAY";
            default -> "UNKNOWN";
        };
        db.recordPortalUsage(player.getUniqueId().toString(), player.getName(), portalType);
    }

    // ── Movement ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerMove(PlayerMoveEvent event) {
        if (!config.isTrackMovement()) return;

        Location from = event.getFrom();
        Location to = event.getTo();
        if (to == null) return;

        // Skip head-only rotation
        if (from.getBlockX() == to.getBlockX()
                && from.getBlockY() == to.getBlockY()
                && from.getBlockZ() == to.getBlockZ()) return;

        Player player = event.getPlayer();
        UUID uuid = player.getUniqueId();
        double distance = from.distance(to);

        // Ignore teleports (distance > 50 blocks in one tick is suspicious)
        if (distance > 50) return;

        // Classify movement type
        final double walked, sprinted, flown, swum, ridden;
        if (player.isInsideVehicle()) {
            walked = 0; sprinted = 0; flown = 0; swum = 0; ridden = distance;
        } else if (player.isFlying() || player.isGliding()) {
            walked = 0; sprinted = 0; flown = distance; swum = 0; ridden = 0;
        } else if (player.isSwimming() || player.isInWater()) {
            walked = 0; sprinted = 0; flown = 0; swum = distance; ridden = 0;
        } else if (player.isSprinting()) {
            walked = 0; sprinted = distance; flown = 0; swum = 0; ridden = 0;
        } else {
            walked = distance; sprinted = 0; flown = 0; swum = 0; ridden = 0;
        }

        // Accumulate in buffer
        movementBuffer.compute(uuid, (k, vals) -> {
            if (vals == null) vals = new double[5];
            vals[0] += walked;
            vals[1] += sprinted;
            vals[2] += flown;
            vals[3] += swum;
            vals[4] += ridden;
            return vals;
        });

        // Chunk exploration
        int chunkX = to.getBlockX() >> 4;
        int chunkZ = to.getBlockZ() >> 4;
        String chunkKey = to.getWorld().getName() + ":" + chunkX + ":" + chunkZ;
        String prevChunk = lastChunk.put(uuid, chunkKey);
        if (!chunkKey.equals(prevChunk)) {
            db.recordChunkVisit(uuid.toString(), player.getName(),
                    to.getWorld().getName(), chunkX, chunkZ);
        }

        // Biome visits
        Biome biome = to.getBlock().getBiome();
        String biomeName = biome.name();
        String prevBiome = lastBiome.put(uuid, biomeName);
        if (!biomeName.equals(prevBiome)) {
            db.recordBiomeVisit(uuid.toString(), player.getName(), biomeName);
        }
    }

    // ── Bed ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBedEnter(PlayerBedEnterEvent event) {
        if (event.getBedEnterResult() != PlayerBedEnterEvent.BedEnterResult.OK) return;

        Player player = event.getPlayer();
        db.recordBedUsage(player.getUniqueId().toString(), player.getName());
    }

    // ── Fishing ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onFish(PlayerFishEvent event) {
        if (event.getState() != PlayerFishEvent.State.CAUGHT_FISH) return;

        Player player = event.getPlayer();
        Entity caught = event.getCaught();
        String catchType = "UNKNOWN";
        if (caught instanceof Item item) {
            catchType = item.getItemStack().getType().name();
        }
        db.recordFishing(player.getUniqueId().toString(), player.getName(), catchType);
    }

    // ── Animal Taming ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onAnimalTame(EntityTameEvent event) {
        if (!(event.getOwner() instanceof Player player)) return;

        String animalType = event.getEntity().getType().name();
        db.recordAnimalTame(player.getUniqueId().toString(), player.getName(), animalType);
    }

    // ── Animal Breeding ──

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onAnimalBreed(EntityBreedEvent event) {
        if (!(event.getBreeder() instanceof Player player)) return;

        String animalType = event.getEntity().getType().name();
        db.recordAnimalBreed(player.getUniqueId().toString(), player.getName(), animalType);
    }

    // ── Helpers ──

    private void flushMovement() {
        if (movementBuffer.isEmpty()) return;

        Map<UUID, double[]> snapshot = new ConcurrentHashMap<>(movementBuffer);
        movementBuffer.clear();

        for (var entry : snapshot.entrySet()) {
            UUID uuid = entry.getKey();
            double[] vals = entry.getValue();
            Player player = plugin.getServer().getPlayer(uuid);
            String name = player != null ? player.getName() : uuid.toString();

            db.queueMovement(uuid.toString(), name, vals[0], vals[1], vals[2], vals[3], vals[4]);
        }
    }

    private int calculateShiftCraftAmount(CraftItemEvent event) {
        ItemStack result = event.getRecipe().getResult();
        int resultAmount = result.getAmount();

        // Find the minimum stack size in the crafting grid to determine max crafts
        int minStack = Integer.MAX_VALUE;
        for (ItemStack item : event.getInventory().getMatrix()) {
            if (item != null && !item.getType().isAir()) {
                minStack = Math.min(minStack, item.getAmount());
            }
        }
        if (minStack == Integer.MAX_VALUE) minStack = 1;

        return resultAmount * minStack;
    }
}
