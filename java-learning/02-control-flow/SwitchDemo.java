public class SwitchDemo {
    public static void main(String[] args) {
        int day = 3;
        String dayName;

        switch (day) {
            case 1:
                dayName = "Monday";
                break;
            case 2:
                dayName = "Tuesday";
                break;
            case 3:
                dayName = "Wednesday";
                break;
            default:
                dayName = "Unknown";
        }
        System.out.println("Day: " + dayName);

        // Modern "arrow" switch expression (Java 14+): no fall-through, returns a value
        String type = switch (day) {
            case 1, 7 -> "Weekend-ish";
            case 2, 3, 4, 5, 6 -> "Weekday";
            default -> "Invalid";
        };
        System.out.println("Type: " + type);
    }
}
