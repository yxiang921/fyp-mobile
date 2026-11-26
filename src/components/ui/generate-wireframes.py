"""Generate a monochrome overview of the current FindSight mobile screens."""

from html import escape
from pathlib import Path

OUT = Path(__file__).with_name("mobile-wireframes.svg")
INDIVIDUAL = Path(__file__).with_name("wireframe-images")
W, H = 245, 490
GAP_X, GAP_Y = 28, 62
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1092" height="2260" viewBox="0 0 1092 2260">',
         '<rect width="100%" height="100%" fill="white"/>',
         '<style>text{font-family:Arial,sans-serif;fill:#111} .title{font-size:16px;font-weight:bold} .tiny{font-size:8px} .small{font-size:10px} .label{font-size:11px;font-weight:bold} .stroke{fill:white;stroke:#111;stroke-width:1.2} .line{stroke:#111;stroke-width:1.1;fill:none}</style>']

def add(s): parts.append(s)
def rect(x,y,w,h,r=0): add(f'<rect class="stroke" x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/>')
def line(x1,y1,x2,y2): add(f'<path class="line" d="M{x1} {y1}L{x2} {y2}"/>')
def text(x,y,s,cls='small'): add(f'<text class="{cls}" x="{x}" y="{y}">{escape(s)}</text>')
def circle(x,y,r): add(f'<circle class="stroke" cx="{x}" cy="{y}" r="{r}"/>')
def image_box(x,y,w,h):
    rect(x,y,w,h); line(x,y,x+w,y+h); line(x+w,y,x,y+h)
def button(x,y,w,label):
    rect(x,y,w,28,3); text(x+w/2,y+18,label,'small');
def field(x,y,w,label,placeholder=''): 
    text(x,y,label,'tiny'); rect(x,y+5,w,27,2)
    if placeholder: text(x+8,y+22,placeholder,'tiny')
def header(title, back=False, right=''):
    if back: text(16,38,'‹','title')
    text(32 if back else 16,37,title,'label')
    if right: text(228,37,right,'tiny')
    line(0,48,W,48)
def tabs(active='Browse'):
    line(0,449,W,449)
    for i,name in enumerate(['Browse','Cases','Report','Profile']):
        x=31+i*61; circle(x,464,5); text(x-16,483,name,'tiny')
        if name==active: line(x-17,487,x+17,487)
def card(x,y,name,detail='Case # 000123',wide=213):
    rect(x,y,wide,76,3); text(x+9,y+18,name,'label'); text(x+9,y+32,detail,'tiny')
    text(x+9,y+47,'Last seen: Kuala Lumpur','tiny'); image_box(x+wide-58,y+9,47,47)
    text(x+9,y+64,'● ● ● ● ☆','tiny')
def screen(i,caption,draw):
    col,row=i%4,i//4; ox=17+col*(W+GAP_X); oy=52+row*(H+GAP_Y)
    text(ox,oy-14,f'{i+1:02d}  {caption}','title')
    add(f'<g transform="translate({ox},{oy})">'); rect(0,0,W,H,5); draw(); add('</g>')

def login():
    header('Sign in'); text(78,117,'FindSight','title'); text(28,137,'Missing person reporting and search','tiny')
    field(18,177,209,'Email','you@example.com'); field(18,227,209,'Password','••••••••')
    button(18,288,209,'Sign in'); button(18,327,209,'Continue as guest')
    text(35,393,'Officers can access case management','tiny')
screen(0,'Sign in',login)

def gallery():
    header('Missing Persons',right='Report'); text(16,68,'Track a case       Offline reports','tiny')
    field(16,82,213,'','Search name or location'); button(16,126,99,'List'); button(129,126,100,'Grid')
    card(16,166,'Aisyah Binti Ali'); card(16,251,'Daniel Lim','Case # 000124')
    card(16,336,'Raj Kumar','Case # 000125'); tabs('Browse')
screen(1,'Missing persons · list',gallery)

def gallery_grid():
    header('Missing Persons',right='Report'); field(16,68,213,'','Search name or location')
    button(16,112,99,'List'); button(129,112,100,'Grid')
    for n,(x,y) in enumerate([(16,151),(127,151),(16,290),(127,290)]):
        rect(x,y,102,126,2); image_box(x+8,y+8,86,75); text(x+8,y+99,['Aisyah Ali','Daniel Lim','Raj Kumar','Siti Nur'][n],'tiny'); text(x+8,y+113,'Case # 00012'+str(n+3),'tiny')
    tabs('Browse')
screen(2,'Missing persons · grid',gallery_grid)

def person():
    header('Case Details',True); image_box(16,65,86,100); text(113,85,'Aisyah Binti Ali','label')
    text(113,103,'Case # 000123','tiny'); text(113,123,'Status: Active','tiny')
    line(16,179,229,179); text(16,198,'Last seen','label'); text(16,216,'Jalan Sultan, Kuala Lumpur','tiny')
    text(16,246,'Last-worn clothing','label'); text(16,263,'Red shirt, dark trousers','tiny')
    text(16,293,'Distinguishing features','label'); text(16,310,'Glasses; small scar','tiny')
    text(16,340,'Description','label'); line(16,353,210,353); line(16,362,182,362)
    button(16,397,213,"I've seen this person")
screen(3,'Missing person details',person)

def sighting():
    header('Case Details',True); rect(9,61,227,408,4)
    text(24,87,'Report a sighting','title'); text(24,102,'Share where you saw this person','tiny')
    field(24,122,197,'Location *','Location or address'); field(24,169,94,'Date','YYYY-MM-DD')
    field(128,169,93,'Time','HH:MM'); field(24,216,197,'Your name','Optional')
    field(24,263,197,'Phone','Optional'); field(24,310,197,'Notes','Clothing, direction...')
    button(24,360,197,'Attach photos / videos'); button(24,402,197,'Submit report')
    text(101,455,'Close','small')
screen(4,'Report a sighting',sighting)

def report_top():
    header('Report a missing person',True)
    field(16,69,213,'Full name *','e.g. Ahmad bin Ali'); field(16,115,213,'IC number')
    text(16,172,'Gender','tiny'); rect(16,180,101,29,2); rect(127,180,102,29,2)
    text(48,199,'Male','small'); text(155,199,'Female','small')
    field(16,224,213,'Date of birth','YYYY-MM-DD'); text(16,285,'Person specifications','label')
    field(16,300,101,'Ethnicity'); field(127,300,102,'Nationality')
    field(16,350,101,'Height (cm)'); field(127,350,102,'Weight (kg)')
    field(16,400,101,'Hair type'); field(127,400,102,'Hair color')
screen(5,'Missing person report · 1',report_top)

def report_bottom():
    header('Report a missing person',True)
    field(16,68,213,'Last-worn clothing'); field(16,116,213,'Distinguishing features')
    field(16,164,213,'Last seen location *'); field(16,212,213,'Last seen date')
    field(16,260,213,'Description'); text(16,317,'Photo','tiny'); image_box(16,327,73,65)
    button(100,345,129,'Choose photo'); rect(16,410,11,11); text(33,420,'Consent to sharing report','tiny')
    button(16,441,213,'Submit report')
screen(6,'Missing person report · 2',report_bottom)

def success():
    header('Report submitted',True); circle(122,155,37); text(107,168,'✓','title')
    text(49,229,'Report submitted','title'); text(68,257,'Your case number is','small')
    rect(35,272,175,56,2); text(75,306,'MP-2026-00123','label')
    text(36,357,'An officer will review your case.','tiny')
    button(16,406,213,'Back to gallery')
screen(7,'Report confirmation',success)

def tracking():
    header('Track a case',True); text(16,74,'Enter your case number to check status.','tiny')
    field(16,100,213,'Case number','MP-2026-00123'); button(16,156,213,'Check status')
    rect(16,208,213,143,3); text(28,232,'Case # MP-2026-00123','label')
    text(28,260,'Status: Active','small'); text(28,285,'Submitted: 29 Oct 2026','small')
    text(28,310,'Updated: 29 Oct 2026','small')
screen(8,'Track a case',tracking)

def cases():
    header('Cases',right='Profile'); field(16,66,213,'','Search name or case number')
    for x,w,t in [(16,36,'All'),(58,54,'Active'),(119,59,'Found'),(185,44,'Other')]:
        rect(x,111,w,25,9); text(x+7,128,t,'tiny')
    card(16,153,'Aisyah Binti Ali'); card(16,238,'Daniel Lim','Case # 000124')
    card(16,323,'Raj Kumar','Case # 000125'); tabs('Cases')
screen(9,'Officer cases',cases)

def case_detail():
    header('Case Details',True); rect(16,67,213,108,2); text(27,87,'Case map','label')
    for x,y in [(72,124),(124,111),(174,145)]: circle(x,y,4)
    image_box(16,190,73,82); text(99,210,'Aisyah Binti Ali','label')
    text(99,228,'Case # 000123','tiny'); text(99,246,'Status: Active','tiny')
    text(16,300,'Detections','label'); rect(16,310,213,39,2)
    text(26,334,'Camera 01 · 29 Oct 2026','tiny')
    text(16,374,'Alerts and sightings','label'); rect(16,384,213,39,2)
    text(26,408,'Recent activity item','tiny')
screen(10,'Officer case details',case_detail)

def notifications():
    header('Notifications',right='Mark all read')
    for y,t in [(71,'Possible match detected'),(151,'New case update'),(231,'Sighting report received'),(311,'Case status changed')]:
        rect(16,y,213,68,2); circle(29,y+19,5); text(42,y+21,t,'label')
        line(42,y+36,211,y+36); text(42,y+53,'View details   ·   Today','tiny')
    tabs('Profile')
screen(11,'Notifications',notifications)

def notification_detail():
    header('Notification',True); text(16,81,'Possible match detected','title')
    line(16,98,211,98); line(16,109,180,109); text(16,131,'29 Oct 2026 · 10:42','tiny')
    text(16,163,'Missing person','label'); image_box(16,175,72,77)
    text(98,195,'Aisyah Binti Ali','label'); text(98,213,'Case # 000123','tiny')
    text(16,282,'Detection','label'); rect(16,295,213,98,2)
    text(27,317,'Camera: CCTV 01','tiny'); text(27,337,'Location: Kuala Lumpur','tiny')
    text(27,357,'Time: 10:42','tiny'); button(16,415,213,'Get directions')
screen(12,'Notification details',notification_detail)

def profile():
    header('Profile',True); circle(122,104,30); text(113,111,'A','title')
    text(76,152,'Officer Account','label'); text(97,169,'Officer','tiny')
    rect(16,193,213,88,2); text(28,215,'Account information','label')
    text(28,238,'Email: officer@example.com','tiny'); text(28,258,'Role: Officer','tiny')
    rect(16,294,213,106,2); text(28,318,'Push notifications','label')
    text(28,340,'Device status: Registered','tiny'); button(28,355,95,'Refresh token')
    button(134,355,83,'Test push'); button(16,425,213,'Log out')
screen(13,'Profile',profile)

def outbox():
    header('Offline reports',True); text(16,72,'Saved on this device until connected.','tiny')
    for y,status in [(96,'Waiting to send'),(223,'Needs attention')]:
        rect(16,y,213,112,2); text(28,y+22,status,'label')
        text(28,y+42,'29 Oct 2026 · Missing person report','tiny')
        button(28,y+58,90,'Retry'); button(128,y+58,89,'Delete')
screen(14,'Offline reports',outbox)

def index():
    header('FindSight'); text(18,90,'FindSight','title')
    text(18,111,'Help locate missing persons.','small')
    image_box(18,145,209,117)
    button(18,295,209,'Browse missing persons')
    button(18,335,209,'Report a missing person')
    button(18,375,209,'Sign in')
screen(15,'Home',index)

parts.append('</svg>')
board = '\n'.join(parts)
OUT.write_text(board, encoding='utf-8')

# Export each screen as an individual SVG image. SVG keeps the black line work
# sharp when it is inserted into the final report or printed.
INDIVIDUAL.mkdir(exist_ok=True)
for i, caption in enumerate([
    'sign-in', 'missing-persons-list', 'missing-persons-grid', 'person-details',
    'report-sighting', 'missing-person-report-1', 'missing-person-report-2',
    'report-confirmation', 'track-case', 'officer-cases', 'officer-case-details',
    'notifications', 'notification-details', 'profile', 'offline-reports', 'home',
]):
    col, row = i % 4, i // 4
    x, y = 17 + col * (W + GAP_X), 52 + row * (H + GAP_Y)
    individual = board.replace(
        'width="1092" height="2260" viewBox="0 0 1092 2260"',
        f'width="{W}" height="{H}" viewBox="{x} {y} {W} {H}"',
        1,
    )
    (INDIVIDUAL / f'{i + 1:02d}-{caption}.svg').write_text(individual, encoding='utf-8')
print(OUT)
print(INDIVIDUAL)
