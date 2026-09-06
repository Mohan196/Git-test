import java.util.ArrayList;
import java.util.List;

public class ListDemo {
    public static void main(String[] args) {
        // ArrayList: a resizable array — grow/shrink as needed
        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");

        System.out.println("Names: " + names);
        System.out.println("First: " + names.get(0));

        names.remove("Bob");
        System.out.println("After removing Bob: " + names);

        System.out.println("Contains Alice? " + names.contains("Alice"));
        System.out.println("Size: " + names.size());

        for (String name : names) {
            System.out.println("- " + name);
        }
    }
}
