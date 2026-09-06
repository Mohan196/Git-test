import java.util.HashMap;
import java.util.Map;

public class MapDemo {
    public static void main(String[] args) {
        // HashMap: key -> value pairs, like a Python dict or JS object
        Map<String, Integer> ages = new HashMap<>();
        ages.put("Alice", 30);
        ages.put("Bob", 25);
        ages.put("Charlie", 35);

        System.out.println("Bob's age: " + ages.get("Bob"));
        System.out.println("Contains Dave? " + ages.containsKey("Dave"));

        // getOrDefault avoids null checks for missing keys
        System.out.println("Dave's age: " + ages.getOrDefault("Dave", -1));

        ages.put("Bob", 26); // overwrite
        ages.remove("Charlie");

        System.out.println("All entries:");
        for (Map.Entry<String, Integer> entry : ages.entrySet()) {
            System.out.println(entry.getKey() + " -> " + entry.getValue());
        }
    }
}
