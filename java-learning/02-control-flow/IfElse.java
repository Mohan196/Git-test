public class IfElse {
    public static void main(String[] args) {
        int score = 82;

        if (score >= 90) {
            System.out.println("Grade: A");
        } else if (score >= 80) {
            System.out.println("Grade: B");
        } else if (score >= 70) {
            System.out.println("Grade: C");
        } else {
            System.out.println("Grade: F");
        }

        // Ternary operator: shorthand for a simple if/else that returns a value
        String result = (score >= 60) ? "Pass" : "Fail";
        System.out.println("Result: " + result);
    }
}
